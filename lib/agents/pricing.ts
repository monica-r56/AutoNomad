const TEQUILA_API_BASE = process.env.TEQUILA_API_BASE?.replace(/\/+$/, "") ?? "https://tequila-api.kiwi.com";
const TEQUILA_API_KEY = process.env.TEQUILA_API_KEY;

const AMADEUS_BASE = process.env.AMADEUS_BASE?.replace(/\/+$/, "") ?? "https://test.api.amadeus.com";
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

import { withRateLimit, type RateLimitOptions } from "@/lib/utils/rate-limiter";
import { withRetry } from "@/lib/utils/retry";
import { Place } from "@/lib/agents/places";

const TEQUILA_RATE_LIMIT: RateLimitOptions = { limit: 5, interval: 1000 };
const AMADEUS_RATE_LIMIT: RateLimitOptions = { limit: 2, interval: 1000 };

export interface PricingRequest {
  tripDetails: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string;
    travelers: number;
  };
  budget: number;
  currency: string;
  pace: "fast" | "slow";
  places?: Place[];
}

interface TransportationCost {
  type: "flight" | "train" | "bus";
  provider: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cost: number;
  perPerson: number;
  class: string;
  rating: number;
}

interface AccommodationCost {
  name: string;
  type: "hotel" | "hostel" | "airbnb";
  nights: number;
  pricePerNight: number;
  totalCost: number;
  rating: number;
  amenities: string[];
  location: string;
}

interface ActivityCost {
  name: string;
  type: string;
  cost: number;
  perPerson: number;
  duration: string;
  category: "must-see" | "optional" | "free";
}

export interface PricingResponse {
  tripDetails: {
    origin: string;
    destination: string;
    travelers: number;
    nights: number;
  };
  budgetSummary: {
    allocatedBudget: number;
    currency: string;
    transportation: {
      outbound: TransportationCost;
      return: TransportationCost;
      subtotal: number;
    };
    accommodation: AccommodationCost;
    activities: {
      items: ActivityCost[];
      subtotal: number;
    };
    meals: number;
    contingency: number;
    totalEstimated: number;
    remaining: number;
    budgetViability: "feasible" | "tight" | "exceeds";
    recommendations: string[];
  };
}

let amadeusToken: { value: string; expiresAt: number } | null = null;

export async function estimatePricing(params: PricingRequest): Promise<PricingResponse> {
  const { tripDetails, budget, currency, pace, places } = params;
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(tripDetails.returnDate).getTime() - new Date(tripDetails.departureDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const [flights, hotel] = await Promise.all([
    fetchFlights(tripDetails, pace).catch(async (err: Error) => {
      console.warn("[Pricing Agent] Tequila flight search failed, trying Amadeus:", err.message);
      return fetchFlightsWithAmadeus(tripDetails).catch((amadeusErr: Error) => {
        console.warn("[Pricing Agent] Amadeus flight search failed too:", amadeusErr.message);
        return getFallbackFlights(tripDetails, budget);
      });
    }),
    fetchHotels(tripDetails, nights).catch((err) => {
      console.warn("[Pricing Agent] Hotel search failed, using fallback:", err.message);
      return getFallbackHotel(tripDetails, nights);
    }),
  ]);
  
  const activityCost = getActivityCosts(tripDetails, pace, places);

  const transportSubtotal = flights.outbound.cost + flights.return.cost;
  const activitiesSubtotal = activityCost.items.reduce((sum, item) => sum + item.cost, 0);
  const meals = nights * tripDetails.travelers * 35;
  const contingency = Math.round(budget * 0.1);
  const totalEstimated =
    transportSubtotal + hotel.totalCost + activitiesSubtotal + meals + contingency;
  const remaining = Math.max(0, budget - totalEstimated);
  
  // Stricter budget viability for realistic planning
  let budgetViability: "feasible" | "tight" | "exceeds" = "feasible";
  if (totalEstimated > budget * 1.5) {
    budgetViability = "exceeds";
  } else if (totalEstimated > budget) {
    budgetViability = "tight";
  }

  return {
    tripDetails: {
      origin: tripDetails.origin,
      destination: tripDetails.destination,
      travelers: tripDetails.travelers,
      nights,
    },
    budgetSummary: {
      allocatedBudget: budget,
      currency,
      transportation: {
        outbound: flights.outbound,
        return: flights.return,
        subtotal: transportSubtotal,
      },
      accommodation: hotel,
      activities: {
        items: activityCost.items,
        subtotal: activitiesSubtotal,
      },
      meals,
      contingency,
      totalEstimated,
      remaining,
      budgetViability,
      recommendations: buildRecommendations(pace),
    },
  };
}

async function fetchFlightsWithAmadeus(tripDetails: PricingRequest["tripDetails"]) {
  const token = await getAmadeusToken();
  if (!token) throw new Error("Amadeus token missing");

  // If the string is already 3 chars and uppercase, assume it's IATA
  const originCode = tripDetails.origin.length === 3 && tripDetails.origin === tripDetails.origin.toUpperCase() 
    ? tripDetails.origin 
    : await resolveCityCode(tripDetails.origin, token);
    
  const destCode = tripDetails.destination.length === 3 && tripDetails.destination === tripDetails.destination.toUpperCase()
    ? tripDetails.destination
    : await resolveCityCode(tripDetails.destination, token);

  if (!originCode || !destCode) {
    throw new Error(`Could not resolve IATA codes: ${originCode || "origin"} to ${destCode || "destination"}`);
  }

  const url = new URL(`${AMADEUS_BASE}/v2/shopping/flight-offers`);
  url.searchParams.set("originLocationCode", originCode);
  url.searchParams.set("destinationLocationCode", destCode);
  url.searchParams.set("departureDate", tripDetails.departureDate);
  url.searchParams.set("returnDate", tripDetails.returnDate);
  url.searchParams.set("adults", `${tripDetails.travelers}`);
  url.searchParams.set("currencyCode", "USD");
  url.searchParams.set("max", "1");

  const response = await guardedRequest("amadeus-flights", AMADEUS_RATE_LIMIT, () =>
    fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })
  );

  if (!response.ok) {
    throw new Error(`Amadeus flight search failed: ${response.statusText}`);
  }

  const data = await response.json();
  const offer = data.data?.[0];
  if (!offer) {
    throw new Error("No flight offers found in Amadeus");
  }

  const itinerary = offer.itineraries[0];
  const returnItinerary = offer.itineraries[1];
  const price = parseFloat(offer.price.total);
  
  const outboundLeg: TransportationCost = {
    type: "flight",
    provider: offer.validatingAirlineCodes?.[0] || "Amadeus",
    departureTime: itinerary.segments[0].departure.at.split("T")[1].slice(0, 5),
    arrivalTime: itinerary.segments[itinerary.segments.length - 1].arrival.at.split("T")[1].slice(0, 5),
    duration: itinerary.duration.replace("PT", "").toLowerCase(),
    cost: Math.round(price / 2),
    perPerson: Math.round(price / tripDetails.travelers / 2),
    class: "economy",
    rating: 4.5,
  };

  const returnLeg: TransportationCost = {
    type: "flight",
    provider: offer.validatingAirlineCodes?.[0] || "Amadeus",
    departureTime: returnItinerary.segments[0].departure.at.split("T")[1].slice(0, 5),
    arrivalTime: returnItinerary.segments[returnItinerary.segments.length - 1].arrival.at.split("T")[1].slice(0, 5),
    duration: returnItinerary.duration.replace("PT", "").toLowerCase(),
    cost: Math.round(price / 2),
    perPerson: Math.round(price / tripDetails.travelers / 2),
    class: "economy",
    rating: 4.5,
  };

  return { outbound: outboundLeg, return: returnLeg };
}

async function fetchFlights(tripDetails: PricingRequest["tripDetails"], pace: PricingRequest["pace"]) {
  if (!TEQUILA_API_KEY) {
    throw new Error("Tequila API key missing");
  }

  const url = new URL(`${TEQUILA_API_BASE}/v2/search`);
  const departure = formatDateForTequila(tripDetails.departureDate);
  const arrival = formatDateForTequila(tripDetails.returnDate);

  url.searchParams.set("fly_from", tripDetails.origin);
  url.searchParams.set("fly_to", tripDetails.destination);
  url.searchParams.set("date_from", departure);
  url.searchParams.set("date_to", departure);
  url.searchParams.set("return_from", arrival);
  url.searchParams.set("return_to", arrival);
  url.searchParams.set("adults", `${tripDetails.travelers}`);
  url.searchParams.set("curr", "USD");
  url.searchParams.set("max_stopovers", "1");
  url.searchParams.set("sort", "price");
  url.searchParams.set("limit", "1");

  const response = await guardedRequest("tequila", TEQUILA_RATE_LIMIT, () =>
    fetch(url.toString(), {
      headers: { apikey: TEQUILA_API_KEY },
    })
  );

  if (!response.ok) {
    throw new Error(`Tequila flight search failed: ${response.statusText}`);
  }

  const data = await response.json();
  const flight = data.data?.[0];
  if (!flight) {
    throw new Error("No flights returned from Tequila");
  }

  // Tequila return flights are in the same route array
  const outboundRoute = flight.route.filter((r: any) => !r.return);
  const returnRoute = flight.route.filter((r: any) => r.return);

  return {
    outbound: mapTequilaFlightLeg(flight, outboundRoute, tripDetails.travelers),
    return: mapTequilaFlightLeg(flight, returnRoute, tripDetails.travelers),
  };
}

function mapTequilaFlightLeg(raw: any, route: any[], travelers: number): TransportationCost {
  const dep = route[0];
  const ret = route[route.length - 1];
  // Price is for the whole trip, so we split it for outbound/return representation
  const cost = Math.round((raw.price ?? 400) * travelers / 2);
  const perPerson = Math.round(cost / Math.max(1, travelers));
  
  return {
    type: "flight",
    provider: dep?.airline ?? "Kiwi",
    departureTime: dep?.local_departure?.split("T")[1]?.slice(0, 5) ?? "10:30",
    arrivalTime: ret?.local_arrival?.split("T")[1]?.slice(0, 5) ?? "14:20",
    duration: raw.fly_duration ?? "2h 30m",
    cost,
    perPerson,
    class: "economy",
    rating: 4.5,
  };
}

async function fetchHotels(tripDetails: PricingRequest["tripDetails"], nights: number) {
  try {
    const token = await getAmadeusToken();
    if (!token) {
      throw new Error("Unable to fetch Amadeus token");
    }

    // If the string is already 3 chars and uppercase, assume it's IATA
    const cityCode = tripDetails.destination.length === 3 && tripDetails.destination === tripDetails.destination.toUpperCase()
      ? tripDetails.destination
      : await resolveCityCode(tripDetails.destination, token);

    if (!cityCode) {
      throw new Error("Unable to resolve city code for hotels");
    }

    const url = new URL(`${AMADEUS_BASE}/v2/shopping/hotel-offers`);
    url.searchParams.set("cityCode", cityCode);
    url.searchParams.set("checkInDate", tripDetails.departureDate);
    url.searchParams.set("checkOutDate", tripDetails.returnDate);
    url.searchParams.set("adults", `${tripDetails.travelers}`);
    url.searchParams.set("bestRateOnly", "true");
    url.searchParams.set("radius", "20");
    url.searchParams.set("radiusUnit", "KM");

    const response = await guardedRequest("amadeus", AMADEUS_RATE_LIMIT, () =>
      fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    if (!response.ok) {
      throw new Error("Amadeus hotel search failed");
    }

    const data = await response.json();
    const offer = data.data?.[0];
    const hotelName = offer?.hotel?.name ?? "Premium City Hotel";
    const pricePerNight = Number(offer?.offers?.[0]?.price?.base ?? 130);

    return {
      name: hotelName,
      type: "hotel" as const,
      nights,
      pricePerNight,
      totalCost: pricePerNight * nights,
      rating: offer?.hotel?.rating ?? 4.6,
      amenities: offer?.hotel?.amenities ?? ["WiFi", "Breakfast", "Gym"],
      location: tripDetails.destination,
    };
  } catch (error) {
    console.error("[Pricing Agent] Amadeus error:", error);
    throw error;
  }
}

async function getAmadeusToken() {
  const now = Date.now();
  if (amadeusToken && amadeusToken.expiresAt > now) {
    return amadeusToken.value;
  }
  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    return null;
  }

  const url = `${AMADEUS_BASE}/v1/security/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: AMADEUS_CLIENT_ID,
    client_secret: AMADEUS_CLIENT_SECRET,
  });

  const response = await withRetry(
    () =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }),
    { attempts: 3, delayMs: 250 }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const expiresIn = Number(data.expires_in ?? 0) * 1000;
  const value = data.access_token;
  amadeusToken = {
    value,
    expiresAt: Date.now() + expiresIn - 30_000,
  };
  return value;
}

async function resolveCityCode(destination: string, token: string) {
  // Clean the destination string (e.g. "Bengaluru, Karnataka, India" -> "Bengaluru")
  const cityQuery = destination.split(",")[0].trim();
  
  // Try to find the city or airport code
  const url = new URL(`${AMADEUS_BASE}/v1/reference-data/locations`);
  url.searchParams.set("keyword", cityQuery);
  url.searchParams.set("subType", "CITY,AIRPORT");
  url.searchParams.set("page[limit]", "5");

  const response = await withRetry(
    () =>
      fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      }),
    { attempts: 3, delayMs: 250 }
  );

  if (!response.ok) {
    console.warn(`[Pricing Agent] resolveCityCode failed for ${cityQuery}: ${response.status}`);
    return null;
  }
  
  const data = await response.json();
  const locations = data.data || [];
  
  if (locations.length === 0) {
    console.warn(`[Pricing Agent] No locations found for keyword: ${cityQuery}`);
    return null;
  }

  // Prefer IATA codes if available, and prefer CITY over AIRPORT if both exist
  const cityWithIata = locations.find((l: any) => l.subType === "CITY" && l.iataCode);
  if (cityWithIata) return cityWithIata.iataCode;

  const anyWithIata = locations.find((l: any) => l.iataCode);
  return anyWithIata?.iataCode || locations[0].iataCode || locations[0].id;
}

function formatDateForTequila(dateStr: string) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getFallbackFlights(tripDetails: PricingRequest["tripDetails"], budget: number) {
  const perPerson = Math.max(220, Math.round(budget / 12));
  const outboundCost = perPerson * tripDetails.travelers;
  const inboundCost = perPerson * tripDetails.travelers;

  return {
    outbound: {
      type: "flight" as const,
      provider: "Kiwi.com",
      departureTime: "10:30",
      arrivalTime: "14:20",
      duration: "2h 30m",
      cost: outboundCost,
      perPerson,
      class: "economy",
      rating: 4.5,
    },
    return: {
      type: "flight" as const,
      provider: "Kiwi.com",
      departureTime: "16:00",
      arrivalTime: "20:45",
      duration: "2h 45m",
      cost: inboundCost,
      perPerson,
      class: "economy",
      rating: 4.5,
    },
  };
}

function getFallbackHotel(tripDetails: PricingRequest["tripDetails"], nights: number): AccommodationCost {
  const pricePerNight = 120;
  return {
    name: "Premium City Hotel",
    type: "hotel" as const,
    nights,
    pricePerNight,
    totalCost: pricePerNight * nights,
    rating: 4.6,
    amenities: ["WiFi", "Breakfast", "Gym", "Spa"],
    location: tripDetails.destination,
  };
}

function getActivityCosts(
  tripDetails: PricingRequest["tripDetails"],
  pace: PricingRequest["pace"],
  places?: Place[]
) {
  const travelers = tripDetails.travelers;
  
  if (places && places.length > 0) {
    // Estimate based on actual places
    const items = places.slice(0, 5).map((place) => {
      const perPerson = getPriceValue(place.price);
      return {
        name: place.name,
        type: place.type,
        duration: `${place.duration ?? 90}m`,
        category: "must-see" as const,
        cost: perPerson * travelers,
        perPerson,
      };
    });
  
    return { items, subtotal: items.reduce((sum, item) => sum + item.cost, 0) };
  }

  // Fallback if no places provided
  const baseActivities = [
    {
      name: "City Highlights Tour",
      type: "guided-tour",
      duration: "3h",
      category: "must-see" as const,
      perPerson: 50,
    },
    {
      name: "Local Experience",
      type: "activity",
      duration: "2h",
      category: (pace === "fast" ? "optional" : "must-see") as "must-see" | "optional" | "free",
      perPerson: 40,
    },
  ];

  const items: ActivityCost[] = baseActivities.map((activity) => ({
    name: activity.name,
    type: activity.type,
    duration: activity.duration,
    category: activity.category,
    cost: activity.perPerson * travelers,
    perPerson: activity.perPerson,
  }));

  return { items, subtotal: items.reduce((sum, item) => sum + item.cost, 0) };
}

function getPriceValue(price?: string): number {
  if (!price) return 25;
  if (price === "Free") return 0;
  return price.length * 20;
}

function buildRecommendations(pace: PricingRequest["pace"]) {
  return pace === "fast"
    ? [
        "Rise early—the first flights pull in before lunch",
        "Book optional activities in blocks to save time",
        "Use public transit passes for quick city hops",
      ]
    : [
        "Add an extra night for better hotel rates",
        "Mix paid activities with free walking tours",
        "Book museum passes early for discounts",
      ];
}

async function guardedRequest<T>(
  key: string,
  opts: RateLimitOptions,
  fn: () => Promise<T>
): Promise<T> {
  return withRetry(
    () => withRateLimit(key, opts, fn),
    { attempts: 3, delayMs: 300 }
  );
}

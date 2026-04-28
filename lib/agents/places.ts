import { calculateDistance, Location } from "@/lib/route-optimizer";
import { resolveLocation } from "@/lib/agents/location";
import { withRateLimit, type RateLimitOptions } from "@/lib/utils/rate-limiter";
import { withRetry } from "@/lib/utils/retry";

const GOOGLE_BASE = process.env.PLACES_API_BASE?.replace(/\/+$/, "") ??
  "https://places.googleapis.com/v1";
const GOOGLE_KEY = process.env.PLACES_API_KEY;
const OPEN_TRIP_BASE = "https://api.opentripmap.com/0.1/en/places";

const OUTDOOR_KEYWORDS = new Set([
  "park",
  "tourist_attraction",
  "stadium",
  "zoo",
  "amusement_park",
  "natural_feature",
  "garden",
  "beach",
  "observation_deck",
]);
const INDOOR_KEYWORDS = new Set([
  "museum",
  "church",
  "art_gallery",
  "aquarium",
  "shopping_mall",
  "movie_theater",
  "library",
]);

const DEFAULT_RADIUS_KM = 15;
const GOOGLE_RATE_LIMIT: RateLimitOptions = { limit: 5, interval: 1000 };
const OPEN_TRIP_RATE_LIMIT: RateLimitOptions = { limit: 10, interval: 1000 };

export interface IndoorAlternative {
  title: string;
  description: string;
  cost: number;
}

export interface Place {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  location: Location;
  address: string;
  duration?: number;
  price?: string;
  image?: string;
  sourceUrl?: string;
  description: string;
  isOutdoor: boolean;
  indoorAlternative?: IndoorAlternative;
  timeRestrictions?: {
    opens?: string;
    closes?: string;
  };
}

export interface PlaceCluster {
  day: number;
  places: Place[];
  clusteringReason: string;
}

export interface PlacesResponse {
  destination: string;
  pace: string;
  location: Location;
  places: Place[];
  clusters: PlaceCluster[];
}

export interface PlanPlacesParams {
  location?: Location;
  destination: string;
  radius?: number;
  pace: "fast" | "slow";
  activityTypes?: string[];
  limit?: number;
}

export async function planPlaces(params: PlanPlacesParams): Promise<PlacesResponse> {
  const radius = params.radius ?? DEFAULT_RADIUS_KM;
  const location = params.location
    ?? (await resolveLocation(params.destination));

  const fetchLimit = Math.max(params.limit ?? 30, 60); // Fetch even more for better sorting
  let places: Place[] = [];
  
  if (GOOGLE_KEY) {
    // Google Nearby Search hard-limits each call to 20 results; for fast pace we do multiple focused
    // searches to capture the truly "touristy/popular" set (e.g., top landmarks) that might not show
    // up when mixing many place types in a single call.
    places = params.pace === "fast"
      ? await fetchPlacesFromGoogleMulti(location, radius, fetchLimit, params.activityTypes, params.destination).catch(() => [])
      : await fetchPlacesFromGoogle(location, radius, fetchLimit, params.activityTypes, params.destination).catch(() => []);
  }

  if (places.length < 10) {
    const otmPlaces = await fetchPlacesFromOpenTripMap(location, radius, fetchLimit, params.activityTypes).catch(() => []);
    places = [...places, ...otmPlaces];
  }

  if (!places.length) {
    throw new Error("Places agent returned no attractions for the destination.");
  }

  const uniquePlaces = dedupePlaces(places);
  
  // Sort based on pace
  if (params.pace === "fast") {
    // Fast pace = "touristy" (high-rating + high-review-count) with minimal low-popularity items.
    const ordered = rankFastPace(uniquePlaces, params.limit ?? 30);
    uniquePlaces.splice(0, uniquePlaces.length, ...ordered);
  } else {
    // Slow pace: more variety, mix high rated with interesting gems (lower review count but good rating)
    uniquePlaces.sort((a, b) => {
      const scoreA = a.rating + (Math.random() * 0.5); // Add some randomness for variety
      const scoreB = b.rating + (Math.random() * 0.5);
      return scoreB - scoreA;
    });
  }

  assignIndoorAlternatives(uniquePlaces);
  
  const finalPlaces = uniquePlaces.slice(0, params.limit ?? 30);

  const clusters = clusterPlaces(finalPlaces, {
    maxDistanceKm: 2.0, // Increased for better day grouping
    pace: params.pace,
  });

  return {
    destination: params.destination,
    pace: params.pace,
    location,
    places: finalPlaces,
    clusters,
  };
}

function rankFastPace(places: Place[], limit: number): Place[] {
  const score = (p: Place) => {
    // Make review-count matter much more than before (log10 barely moves between 5k and 100k).
    // Rating still matters, but in fast mode we prefer "iconic + widely reviewed" spots.
    const ratingScore = p.rating * 100;
    const reviewsScore = Math.log10(Math.max(1, p.reviews)) * 80 + Math.sqrt(Math.max(0, p.reviews));
    return ratingScore + reviewsScore;
  };

  const reviews = places.map((p) => p.reviews).sort((a, b) => a - b);
  const percentile = (p: number) => {
    if (!reviews.length) return 0;
    const idx = Math.min(reviews.length - 1, Math.max(0, Math.floor(p * (reviews.length - 1))));
    return reviews[idx] ?? 0;
  };

  // Adaptive cutoff: at least 5k reviews, and at least the 60th percentile for the current city.
  const cutoff = Math.max(5000, percentile(0.6));

  const popular = places.filter((p) => p.reviews >= cutoff).sort((a, b) => score(b) - score(a));
  const rest = places.filter((p) => p.reviews < cutoff).sort((a, b) => score(b) - score(a));

  // Prefer majority from popular set when possible.
  const targetPopular = Math.max(0, Math.round(limit * 0.85));
  const pickedPopular = popular.slice(0, targetPopular);
  const remainder = limit - pickedPopular.length;
  return [...pickedPopular, ...rest.slice(0, remainder), ...popular.slice(targetPopular)]
    .filter(Boolean);
}

function dedupePlaces(places: Place[]): Place[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
}

function assignIndoorAlternatives(places: Place[]) {
  const indoorCandidates = places.filter((p) => !p.isOutdoor);
  const outdoorPlaces = places.filter((p) => p.isOutdoor && !p.indoorAlternative);

  for (const outdoorPlace of outdoorPlaces) {
    let bestCandidate: Place | null = null;
    let bestDistance = Infinity;

    for (const candidate of indoorCandidates) {
      const distance = calculateDistance(outdoorPlace.location, candidate.location);
      if (distance < bestDistance && distance <= 3) {
        bestDistance = distance;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      outdoorPlace.indoorAlternative = {
        title: bestCandidate.name,
        description: bestCandidate.description,
        cost: bestCandidate.price ? getPriceValue(bestCandidate.price) : 35,
      };
    }
  }
}

function clusterPlaces(places: Place[], options: { maxDistanceKm: number; pace: "fast" | "slow" }) {
  const remaining = [...places];
  const clusters: PlaceCluster[] = [];
  let dayCounter = 1;
  const dailyTimeBudget = options.pace === "fast" ? 420 : 480; // minutes

  while (remaining.length) {
    const base = remaining.shift()!;
    const clusterPlaces: Place[] = [base];
    let totalMinutes = base.duration ?? 90;
    let center = base.location;

    for (let i = remaining.length - 1; i >= 0; i--) {
      const candidate = remaining[i];
      const distance = calculateDistance(center, candidate.location);
      if (distance <= options.maxDistanceKm) {
        const duration = candidate.duration ?? 90;
        if (totalMinutes + duration > dailyTimeBudget) continue;
        totalMinutes += duration;
        clusterPlaces.push(candidate);
        remaining.splice(i, 1);
        center = {
          lat: (center.lat + candidate.location.lat) / 2,
          lng: (center.lng + candidate.location.lng) / 2,
        };
      }
    }

    clusters.push({
      day: dayCounter,
      places: clusterPlaces,
      clusteringReason: `Within ${options.maxDistanceKm.toFixed(1)}km and fits under ${Math.round(dailyTimeBudget / 60)}h of touring time`,
    });
    dayCounter++;
  }

  return clusters;
}

async function fetchPlacesFromGoogle(
  location: Location,
  radius: number,
  limit: number,
  activityTypes?: string[],
  destination?: string
): Promise<Place[]> {
  if (!GOOGLE_KEY) return [];

  try {
    const url = `${GOOGLE_BASE}/places:searchNearby`;
    
    // Google Places API (New) searchNearby
    const body = {
      includedTypes: activityTypes?.length ? activityTypes : ["tourist_attraction", "park", "museum", "historical_landmark"],
      maxResultCount: Math.min(limit, 20), // searchNearby limit is 20
      locationRestriction: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng,
          },
          radius: Math.min(radius * 1000, 50000), // Max 50km
        },
      },
      rankPreference: "POPULARITY",
    };

    const response = await guardedRequest("places-google", GOOGLE_RATE_LIMIT, () =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_KEY!,
          "X-Goog-FieldMask": "places.id,places.displayName,places.types,places.rating,places.userRatingCount,places.location,places.formattedAddress,places.priceLevel,places.photos,places.regularOpeningHours,places.editorialSummary,places.googleMapsUri",
        },
        body: JSON.stringify(body),
      })
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Places Agent] Google API Error:", errorData);
      throw new Error(`Google Places request failed: ${response.statusText}`);
    }

    const payload = await response.json();
    const raw = Array.isArray(payload.places) ? payload.places : [];

    return raw
      .map((item: any) => formatGooglePlace(item, destination))
      .filter((p: Place | null): p is Place => p !== null)
      .slice(0, limit);
  } catch (error) {
    console.error("[Places Agent] Error fetching from Google:", error);
    return [];
  }
}

async function fetchPlacesFromGoogleMulti(
  location: Location,
  radius: number,
  limit: number,
  activityTypes?: string[],
  destination?: string
): Promise<Place[]> {
  // If user explicitly chose types, don't override; just call once.
  if (activityTypes?.length) {
    return fetchPlacesFromGoogle(location, radius, limit, activityTypes, destination);
  }

  const typeGroups: string[][] = [
    ["tourist_attraction"],
    ["historical_landmark", "museum"],
    // "natural_feature" is not supported by Google Places (New) includedTypes for nearby search.
    ["park", "zoo", "amusement_park", "stadium"],
  ];

  const results = await Promise.all(
    typeGroups.map((types) =>
      fetchPlacesFromGoogle(location, radius, 20, types, destination).catch(() => [])
    )
  );

  return results.flat().slice(0, limit);
}

function formatGooglePlace(item: any, destination?: string): Place | null {
  if (!item || !item.location) return null;

  const location: Location = {
    lat: item.location.latitude,
    lng: item.location.longitude,
  };

  const types: string[] = item.types || [];
  const type = types[0] || "point_of_interest";
  const isOutdoor = determineIfOutdoor(types);

  const place: Place = {
    id: item.id,
    name: item.displayName?.text || "Unknown Place",
    type,
    rating: item.rating ?? 4.5,
    reviews: item.userRatingCount ?? 0,
    location,
    address: item.formattedAddress || destination || "",
    description:
      item.editorialSummary?.text ||
      (item.types?.[0]
        ? `${item.types[0].replace(/_/g, " ")} in ${destination ?? "the city"}`
        : `Explore ${item.displayName?.text || "this location"}`),
    duration: estimateDuration(types),
    price: formatPriceLevel(item.priceLevel),
    image: getGooglePhoto(item),
    sourceUrl: item.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${item.id}`,
    isOutdoor,
    timeRestrictions: formatOpeningHours(item.regularOpeningHours),
  };

  return place;
}

function formatOpeningHours(regularOpeningHours: any): Place["timeRestrictions"] {
  if (!regularOpeningHours?.periods?.length) return undefined;
  // Get today's period or just the first one for simplicity
  const period = regularOpeningHours.periods[0];
  if (period.open?.hour === undefined) return undefined;

  const pad = (n: number) => n.toString().padStart(2, "0");
  
  return {
    opens: `${pad(period.open.hour)}:${pad(period.open.minute)}`,
    closes: period.close
      ? `${pad(period.close.hour)}:${pad(period.close.minute)}`
      : undefined,
  };
}

function determineIfOutdoor(types: string[]): boolean {
  if (!types.length) return true;
  for (const type of types) {
    if (INDOOR_KEYWORDS.has(type)) return false;
    if (OUTDOOR_KEYWORDS.has(type)) return true;
  }
  return true;
}

function estimateDuration(types: string[]): number {
  if (types.includes("museum")) return 120;
  if (types.includes("park")) return 90;
  if (types.includes("art_gallery")) return 90;
  return 100;
}

function formatPriceLevel(level: string | undefined): string | undefined {
  if (!level) return undefined;
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  return map[level] || "$$";
}

function getGooglePhoto(place: any): string | undefined {
  const photoName = place.photos?.[0]?.name;
  if (!photoName || !GOOGLE_KEY) return undefined;
  // New API photo URL format
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_KEY}`;
}

async function fetchPlacesFromOpenTripMap(
  location: Location,
  radius: number,
  limit: number,
  activityTypes?: string[]
): Promise<Place[]> {
  const url = new URL(`${OPEN_TRIP_BASE}/radius`);
  url.searchParams.set("radius", `${Math.floor(radius * 1000)}`);
  url.searchParams.set("limit", `${limit}`);
  url.searchParams.set("lat", `${location.lat}`);
  url.searchParams.set("lon", `${location.lng}`);
  url.searchParams.set("format", "json");
  if (activityTypes?.length) {
    // OpenTripMap kinds are comma separated and specific
    // Map common Google types to OTM kinds if necessary, but OTM has broad categories too
    const otmKinds = activityTypes.map(t => {
      if (t === "tourist_attraction") return "interesting_places";
      if (t === "museum") return "museums";
      if (t === "park") return "nature_reserves,parks";
      return t;
    }).join(",");
    url.searchParams.set("kinds", otmKinds);
  } else {
    // Default broad kinds for better results
    url.searchParams.set("kinds", "interesting_places,museums,historic,natural,cultural");
  }

  const response = await guardedRequest("places-opentripmap", OPEN_TRIP_RATE_LIMIT, () =>
    fetch(url.toString())
  );
  if (!response.ok) throw new Error("OpenTripMap request failed");
  const raw = await response.json();

  return raw
    .map((item: any) => formatOpenTripMapPlace(item))
    .filter(Boolean)
    .slice(0, limit);
}

function formatOpenTripMapPlace(item: any): Place | null {
  if (!item || !item.point) return null;

  const types = (item.kinds || "").split(",");
  const type = types[0] || "activity";
  const isOutdoor = determineIfOutdoor(types);

  const place: Place = {
    id: item.xid,
    name: item.name || item.kinds?.split(",")[0] || "Local Experience",
    type,
    rating: item.rate ?? 4.3,
    reviews: Math.round((item.rate ?? 4.3) * 200),
    location: { lat: item.point.lat, lng: item.point.lon },
    address: item.address?.road || item.address?.city || "",
    description: `Discover ${item.name ?? "a local highlight"}`,
    duration: 90,
    price: "$",
    image: item.preview?.source,
    sourceUrl: item.wikipedia_extracts?.url ?? `https://opentripmap.com/en/card/${item.xid}`,
    isOutdoor,
  };

  return place;
}

async function guardedRequest<T>(
  key: string,
  opts: RateLimitOptions,
  fn: () => Promise<T>
): Promise<T> {
  return withRetry(
    () => withRateLimit(key, opts, fn),
    { attempts: 3, delayMs: 250 }
  );
}

function getPriceValue(price?: string): number {
  if (!price) return 45;
  return price.length * 30;
}

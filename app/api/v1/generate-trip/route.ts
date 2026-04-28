import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import type { Itinerary, Badge as BadgeType } from "@/lib/store";
import { Place as PlaceRecord, PlacesResponse, planPlaces } from "@/lib/agents/places";
import { checkWeather } from "@/lib/agents/weather";
import { estimatePricing } from "@/lib/agents/pricing";
import { resolveLocation } from "@/lib/agents/location";
import { optimizeRoute } from "@/lib/route-optimizer";
import { callGemini } from "@/lib/gemini/client";
import { sendTrace } from "@/lib/logging/langsmith";
import { NextRequest, NextResponse } from "next/server";

interface GenerateTripRequest {
  origin: string;
  destination: string;
  departureDate: string;
  duration: number;
  travelers: number;
  budget: number;
  currency: string;
  pace: "fast" | "slow";
  budgetMode?: "normal" | "budget_friendly";
}

const TripState = Annotation.Root({
  tripParams: Annotation<GenerateTripRequest>({
    reducer: (x, y) => y ?? x,
  }),
  places: Annotation<any>({
    reducer: (x, y) => y ?? x,
  }),
  weather: Annotation<any>({
    reducer: (x, y) => y ?? x,
  }),
  pricing: Annotation<any>({
    reducer: (x, y) => y ?? x,
  }),
  itinerary: Annotation<any>({
    reducer: (x, y) => y ?? x,
  }),
  localExpert: Annotation<any>({
    reducer: (x, y) => y ?? x,
  }),
});

async function runWithTrace<T>(node: string, prompt: string, fn: () => Promise<T>) {
  // Use a more descriptive prompt for Gemini trace if needed, but for now keeping it simple
  await sendTrace({ node, status: "start", meta: { prompt } });
  try {
    const result = await fn();
    await sendTrace({ node, status: "success", meta: { prompt, result } });
    return result;
  } catch (error) {
    await sendTrace({
      node,
      status: "error",
      meta: { prompt },
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const params: GenerateTripRequest = await request.json();
    const destinationLocation = await resolveLocation(params.destination);

    const graph = new StateGraph(TripState)
      .addNode("places_node", createPlacesNode(destinationLocation))
      .addNode("weather_node", createWeatherNode(destinationLocation))
      .addNode("pricing_node", createPricingNode())
      .addNode("optimizer_node", createOptimizerNode(destinationLocation))
      .addNode("local_expert_node", createLocalExpertNode())
      .addEdge(START, "places_node")
      .addEdge("places_node", "weather_node")
      .addEdge("weather_node", "pricing_node")
      .addEdge("pricing_node", "optimizer_node")
      .addEdge("optimizer_node", "local_expert_node")
      .addEdge("local_expert_node", END)
      .compile();

    const finalState = await graph.invoke({ tripParams: params });
    const itinerary = finalState.itinerary as Itinerary | undefined;
    const pricingState = finalState.pricing;

    if (!itinerary) {
      throw new Error("Optimizer failed to produce an itinerary");
    }

    return NextResponse.json(
      {
        ...itinerary,
        totalCost: pricingState?.budgetSummary?.totalEstimated ?? itinerary.totalCost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Generate Trip] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate trip",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function createPlacesNode(location: { lat: number; lng: number }) {
  return async (state: typeof TripState.State) => {
    const prompt = `Gather attractions for ${state.tripParams.origin} → ${state.tripParams.destination} (${state.tripParams.pace} pace)`;
    const placesResponse = await runWithTrace("places", prompt, async () => {
      return await planPlaces({
        destination: state.tripParams.destination,
        pace: state.tripParams.pace,
        radius: 15,
        limit: 28,
        location,
      });
    });
    return { places: placesResponse };
  };
}

function createWeatherNode(location: { lat: number; lng: number }) {
  return async (state: typeof TripState.State) => {
    const prompt = `Evaluate weather for ${state.tripParams.destination} on ${state.tripParams.departureDate}`;
    const weatherResponse = await runWithTrace("weather", prompt, async () => {
      return await checkWeather({
        location,
        destination: state.tripParams.destination,
        date: state.tripParams.departureDate,
        activityType: "outdoor",
      });
    });
    return { weather: weatherResponse };
  };
}

function createPricingNode() {
  return async (state: typeof TripState.State) => {
    const prompt = `Estimate budget for ${state.tripParams.origin} → ${state.tripParams.destination}`;
    const pricingResponse = await runWithTrace("pricing", prompt, async () => {
      const placesResponse = state.places as PlacesResponse | undefined;
      return await estimatePricing({
        tripDetails: {
          origin: state.tripParams.origin,
          destination: state.tripParams.destination,
          departureDate: state.tripParams.departureDate,
          returnDate: calculateReturnDate(state.tripParams.departureDate, state.tripParams.duration),
          travelers: state.tripParams.travelers,
        },
        budget: state.tripParams.budget,
        currency: state.tripParams.currency,
        pace: state.tripParams.pace,
        budgetMode: state.tripParams.budgetMode ?? "normal",
        places: placesResponse?.places,
      });
    });
    return { pricing: pricingResponse };
  };
}

function createOptimizerNode(location: { lat: number; lng: number }) {
  return async (state: typeof TripState.State) => {
    const prompt = `Create day-by-day itinerary for ${state.tripParams.origin} → ${state.tripParams.destination}`;
    return runWithTrace("optimizer", prompt, async () => {
      const placesResponse = state.places as PlacesResponse | undefined;
      if (!placesResponse) {
        throw new Error("Optimizer requires places data");
      }
      const pricing = state.pricing;
      const weather = state.weather;
      
      const optimizerInput = placesResponse.places.map((place) => ({
        id: place.id,
        title: place.name,
        location: place.location,
        estimatedDuration: place.duration,
        isOutdoor: place.isOutdoor,
        minTime: place.timeRestrictions?.opens,
        maxTime: place.timeRestrictions?.closes,
      }));
      const optimized = optimizeRoute(optimizerInput, state.tripParams.duration, location);
      const placeMap = new Map(placesResponse.places.map((place) => [place.id, place]));
      
      const days = optimized.clusters.map((cluster) => {
        const date = new Date(state.tripParams.departureDate);
        date.setDate(date.getDate() + Math.max(0, cluster.day - 1));
        const dateStr = date.toISOString().split("T")[0];
        
        // Find weather for this day
        const dayWeather = weather?.forecasts?.find((f: any) => f.date === dateStr);

        let currentTime = 9 * 60; // 9:00 AM
        const activities: any[] = [];

        // Add outbound flight on Day 1
        if (cluster.day === 1 && pricing?.transportation?.outbound) {
          const flight = pricing.transportation.outbound;
          activities.push({
            id: "outbound-flight",
            type: "flight",
            title: `Flight to ${state.tripParams.destination}`,
            description: `Flight via ${flight.provider}. Departure: ${flight.departureTime}, Arrival: ${flight.arrivalTime}`,
            time: flight.departureTime,
            duration: flight.duration,
            cost: flight.cost,
            currency: state.tripParams.currency,
            badges: ["fastest"],
            isOutdoor: false,
            location,
          });
          
          const [arrH, arrM] = flight.arrivalTime.split(":").map(Number);
          currentTime = Math.max(currentTime, arrH * 60 + arrM + 120);
        }

        // Add activities
        cluster.activities.forEach((id) => {
          const place = placeMap.get(id);
          if (!place) return;
          activities.push(buildActivityFromPlace(place, state.tripParams, currentTime, dayWeather));
          currentTime += (place.duration ?? 90) + 30;
        });

        // Add hotel
        if (pricing?.accommodation) {
          const hotel = pricing.accommodation;
          activities.push({
            id: `hotel-day-${cluster.day}`,
            type: "hotel",
            title: hotel.name,
            description: `${hotel.description.slice(0, 100)}...`,
            time: "20:00",
            duration: "Overnight",
            cost: hotel.costPerNight,
            currency: state.tripParams.currency,
            badges: ["top-rated"],
            isOutdoor: false,
            location: hotel.location || location,
          });
        }

        // Add return flight
        if (cluster.day === state.tripParams.duration && pricing?.transportation?.return) {
          const flight = pricing.transportation.return;
          activities.push({
            id: "return-flight",
            type: "flight",
            title: `Flight to ${state.tripParams.origin}`,
            description: `Flight via ${flight.provider}. Departure: ${flight.departureTime}, Arrival: ${flight.arrivalTime}`,
            time: flight.departureTime,
            duration: flight.duration,
            cost: flight.cost,
            currency: state.tripParams.currency,
            badges: [],
            isOutdoor: false,
            location,
          });
        }

        return {
          day: cluster.day,
          date: dateStr,
          activities,
        };
      });

      const itinerary: Itinerary = {
        id: `trip-${Date.now()}`,
        origin: state.tripParams.origin,
        destination: state.tripParams.destination,
        departureDate: state.tripParams.departureDate,
        returnDate: calculateReturnDate(state.tripParams.departureDate, state.tripParams.duration),
        duration: state.tripParams.duration,
        travelers: state.tripParams.travelers,
        budget: state.tripParams.budget,
        currency: state.tripParams.currency,
        pace: state.tripParams.pace,
        days,
        totalCost: pricing?.budgetSummary?.totalEstimated ?? 0,
        budgetViability: pricing?.budgetSummary?.budgetViability ?? "feasible",
        createdAt: new Date().toISOString(),
        status: "draft",
      };

      return { itinerary };
    });
  };
}

function createLocalExpertNode() {
  return async (state: typeof TripState.State) => {
    const itinerary = state.itinerary as Itinerary | undefined;
    if (!itinerary) return {};

    const prompt = `As a local travel expert for ${itinerary.destination}, review this ${itinerary.duration}-day trip from ${itinerary.origin} for ${itinerary.travelers} people. 
    Provide a "Local Secret" or "Pro Tip" for each day of the itinerary. 
    Format your response as a JSON array of strings, one for each day.
    Example: ["Try the street food at market X early morning.", "The hidden viewpoint at Y is best at sunset."]
    
    Itinerary Summary:
    ${itinerary.days.map(d => `Day ${d.day}: ${d.activities.map(a => a.title).join(", ")}`).join("\n")}
    `;

    const expertAdvice = await runWithTrace("local_expert", prompt, async () => {
      const response = await callGemini(prompt);
      try {
        // Clean up markdown if present
        const jsonStr = response?.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(jsonStr || "[]");
      } catch (e) {
        console.warn("[Local Expert] Failed to parse Gemini response:", e);
        return [];
      }
    });

    // Enrich itinerary with expert advice
    if (Array.isArray(expertAdvice) && expertAdvice.length > 0) {
      itinerary.days.forEach((day, i) => {
        if (expertAdvice[i]) {
          day.expertTip = expertAdvice[i];
        }
      });
    }

    return { itinerary, localExpert: expertAdvice };
  };
}

function calculateReturnDate(departureDate: string, duration: number) {
  const start = new Date(departureDate);
  start.setDate(start.getDate() + Math.max(1, duration - 1));
  return start.toISOString().split("T")[0];
}

function buildActivityFromPlace(
  place: PlaceRecord,
  params: GenerateTripRequest,
  startMinute: number,
  weather?: any
) {
  const time = `${String(Math.floor(startMinute / 60)).padStart(2, "0")}:${String(
    startMinute % 60
  ).padStart(2, "0")}`;

  const durationMinutes = place.duration ?? 90;
  const duration = formatDuration(durationMinutes);
  const cost = estimateActivityCost(place, params.pace);
  const badges = buildBadges(place);

  // Use indoor alternative if weather is bad and it's an outdoor activity
  let title = place.name;
  let description = place.description;
  let isOutdoor = place.isOutdoor;
  let usedAlternative = false;

  if (isOutdoor && weather && !weather.isOutdoorSuitable && place.indoorAlternative) {
    title = place.indoorAlternative.title;
    description = `[Weather Alternative] ${place.indoorAlternative.description}`;
    isOutdoor = false;
    usedAlternative = true;
    if (!badges.includes("top-rated")) badges.push("top-rated"); // Mark as a good alternative
  }

  return {
    id: place.id,
    type: usedAlternative ? "activity" : (isOutdoor ? "activity" : "activity"), // Keep type simple for now
    title,
    description,
    time,
    duration,
    cost,
    currency: params.currency,
    image: place.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop", // Fallback image
    sourceUrl: place.sourceUrl,
    badges,
    isOutdoor,
    indoorAlternative: usedAlternative ? undefined : place.indoorAlternative,
    location: place.location,
  };
}

function formatDuration(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (hrs) parts.push(`${hrs}h`);
  if (mins) parts.push(`${mins}m`);
  return parts.join(" ") || "0m";
}

function estimateActivityCost(place: { price?: string; rating: number }, pace: GenerateTripRequest["pace"]) {
  const base = 35 + (place.rating - 4) * 15;
  const priceFactor = place.price ? place.price.length * 20 : 0;
  const paceModifier = pace === "fast" ? 1.1 : 0.9;
  return Math.round((base + priceFactor) * paceModifier);
}

function buildBadges(place: { rating: number; price?: string }): BadgeType[] {
  const badges: BadgeType[] = [];
  if (place.rating >= 4.7) badges.push("hidden-gem");
  if (place.rating >= 4.5) badges.push("top-rated");
  if (place.price === "$") badges.push("cheapest");
  return badges;
}

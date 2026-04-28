import { Location } from "@/lib/route-optimizer";
import { resolveLocation } from "@/lib/agents/location";
import { withRetry } from "@/lib/utils/retry";

const WEATHER_API_BASE = process.env.WEATHER_API_BASE?.replace(/\/+$/, "") ??
  "https://api.open-meteo.com/v1";

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "rainy"
  | "stormy"
  | "snowy";

export interface WeatherCheckRequest {
  location?: Location;
  destination?: string;
  date: string;
  activityType: "outdoor" | "indoor";
}

export interface WeatherForecast {
  date: string;
  temperature: number;
  condition: WeatherCondition;
  isOutdoorSuitable: boolean;
  precipitationChance: number;
}

export interface WeatherResponse {
  location: string;
  forecasts: WeatherForecast[];
  currentRecommendation: string;
}

export async function checkWeather(params: WeatherCheckRequest): Promise<WeatherResponse> {
  const location = params.location ?? (await resolveLocation(params.destination ?? ""));
  
  const url = new URL(`${WEATHER_API_BASE}/forecast`);
  url.searchParams.set("latitude", `${location.lat}`);
  url.searchParams.set("longitude", `${location.lng}`);
  url.searchParams.set("daily", "weathercode,temperature_2m_max,precipitation_probability_max");
  url.searchParams.set("timezone", "auto");

  const response = await withRetry(
    () => fetch(url.toString()),
    { attempts: 3, delayMs: 200 }
  );
  if (!response.ok) {
    throw new Error("Weather API returned an error");
  }

  const payload = await response.json();
  const daily = payload.daily;
  if (!daily || !Array.isArray(daily.time)) {
    throw new Error("Weather API did not return forecast data");
  }

  const forecasts: WeatherForecast[] = daily.time.map((date: string, i: number) => {
    const condition = mapCondition(daily.weathercode[i]);
    const precipitationChance = daily.precipitation_probability_max[i] ?? 0;
    return {
      date,
      temperature: Math.round(daily.temperature_2m_max[i] ?? 20),
      condition,
      precipitationChance,
      isOutdoorSuitable: evaluateOutdoorSuitability(condition, params.activityType, precipitationChance),
    };
  });

  const firstForecast = forecasts[0];
  return {
    location: params.destination ?? `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`,
    forecasts,
    currentRecommendation: buildRecommendation(
      firstForecast.condition,
      firstForecast.isOutdoorSuitable,
      params.activityType
    ),
  };
}

function mapCondition(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code >= 1 && code <= 3) return "cloudy";
  if ((code >= 45 && code <= 48) || (code >= 51 && code <= 57)) return "cloudy";
  if (code >= 61 && code <= 67) return "rainy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code >= 80 && code <= 82) return "rainy";
  if (code >= 95 && code <= 99) return "stormy";
  return "cloudy";
}

function evaluateOutdoorSuitability(
  condition: WeatherCondition,
  activityType: "outdoor" | "indoor",
  precipitationChance: number
): boolean {
  if (condition === "stormy" || condition === "snowy") return activityType === "indoor";
  if (condition === "rainy" && activityType === "outdoor") return false;
  if (precipitationChance > 60 && activityType === "outdoor") return false;
  return true;
}

function buildRecommendation(
  condition: WeatherCondition,
  outdoorSuitable: boolean,
  activityType: "outdoor" | "indoor"
) {
  if (!outdoorSuitable) {
    return `Weather looks ${condition}. Swap to indoor experiences for better comfort.`;
  }

  return `Clear view ahead – perfect weather for ${activityType === "outdoor" ? "outdoor adventures" : "any plan"}.`;
}

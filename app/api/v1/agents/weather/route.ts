import { NextRequest, NextResponse } from "next/server";
import { checkWeather, WeatherCheckRequest } from "@/lib/agents/weather";

export async function POST(request: NextRequest) {
  try {
    const params: WeatherCheckRequest = await request.json();
    const weather = await checkWeather(params);
    return NextResponse.json(weather, { status: 200 });
  } catch (error) {
    console.error("[Weather Agent] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch weather data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

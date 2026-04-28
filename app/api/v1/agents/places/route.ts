import { NextRequest, NextResponse } from "next/server";
import { planPlaces, PlanPlacesParams } from "@/lib/agents/places";

export async function POST(request: NextRequest) {
  try {
    const params: PlanPlacesParams = await request.json();
    const response = await planPlaces({
      destination: params.destination,
      location: params.location,
      radius: params.radius,
      pace: params.pace,
      activityTypes: params.activityTypes,
      limit: params.limit,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[Places Agent] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to plan places",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

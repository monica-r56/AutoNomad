import { NextRequest, NextResponse } from "next/server";
import { estimatePricing, PricingRequest } from "@/lib/agents/pricing";

export async function POST(request: NextRequest) {
  try {
    const params: PricingRequest = await request.json();
    const pricing = await estimatePricing(params);
    return NextResponse.json(pricing, { status: 200 });
  } catch (error) {
    console.error("[Pricing Agent] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to calculate pricing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

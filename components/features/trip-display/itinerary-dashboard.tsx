"use client";

import { useState } from "react";
import { ItineraryTimeline } from "./itinerary-timeline";
import { InteractiveMap } from "./interactive-map";
import { ActionBar } from "./action-bar";
import { ErrorState } from "@/components/common";
import { useAppStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Map as MapIcon, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ItineraryDashboard() {
  const itinerary = useAppStore((s) => s.currentItinerary);
  const setIsGenerating = useAppStore((s) => s.setIsGenerating);
  const addAgentMessage = useAppStore((s) => s.addAgentMessage);
  const setCurrentItinerary = useAppStore((s) => s.setCurrentItinerary);
  const [mobileTab, setMobileTab] = useState("timeline");

  if (!itinerary) {
    return <ErrorState />;
  }

  const handleBudgetFriendlyPlan = async () => {
    setIsGenerating(true);
    addAgentMessage({
      agent: "Budget Expert",
      message: "Re-optimizing your trip for the best value...",
      status: "active"
    });

    try {
      const response = await fetch("/api/v1/generate-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: itinerary.origin,
          destination: itinerary.destination,
          departureDate: itinerary.departureDate,
          duration: itinerary.duration,
          travelers: itinerary.travelers,
          budget: itinerary.budget, // Keep same budget but ask for budget-friendly logic
          currency: itinerary.currency,
          pace: "slow", // Switch to slow pace for better budget options
        }),
      });

      if (!response.ok) throw new Error("Failed to generate budget-friendly plan");
      const data = await response.json();
      setCurrentItinerary(data);
      addAgentMessage({
        agent: "Budget Expert",
        message: "Found a more practical budget-friendly plan!",
        status: "done"
      });
    } catch (error) {
      console.error("Budget adjustment failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Flatten all activities from all days for map
  const allActivities = itinerary.days.flatMap((day) => day.activities);

  return (
    <div className="flex flex-col h-screen">
      {/* Trip header */}
      <div className="border-b bg-card px-4 py-4 lg:px-8 flex-shrink-0">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {itinerary.origin} → {itinerary.destination}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {itinerary.departureDate} to {itinerary.returnDate} &middot;{" "}
                {itinerary.travelers} traveler{itinerary.travelers > 1 ? "s" : ""} &middot;{" "}
                {itinerary.pace === "fast" ? "Fast-paced" : "Slow & local"}
              </p>
            </div>

            {/* Budget Warning Card */}
            {itinerary.budgetViability === "exceeds" && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="size-5 text-destructive" />
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-destructive">
                    Budget too low for this trip
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estimated costs exceed your budget.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="h-8 gap-1 text-[10px]"
                  onClick={handleBudgetFriendlyPlan}
                >
                  <Sparkles className="size-3" />
                  Plan Budget Friendly
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: split pane */}
      <div className="hidden flex-1 lg:flex overflow-hidden">
        <div className="w-1/2 overflow-y-auto border-r">
          <ItineraryTimeline itinerary={itinerary} />
        </div>
        <div className="w-1/2 p-4">
          <InteractiveMap
            activities={allActivities}
            destination={itinerary.destination}
          />
        </div>
      </div>

      {/* Mobile: tabs */}
      <div className="flex-1 lg:hidden overflow-hidden">
        <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex flex-col h-full">
          <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2 flex-shrink-0">
            <TabsTrigger value="timeline" className="gap-1.5">
              <CalendarDays className="size-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-1.5">
              <MapIcon className="size-4" />
              Map
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="flex-1 mt-0 overflow-y-auto">
            <ItineraryTimeline itinerary={itinerary} />
          </TabsContent>
          <TabsContent value="map" className="mt-0 flex-1 p-4">
            <InteractiveMap
              activities={allActivities}
              destination={itinerary.destination}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Action bar */}
      <ActionBar itinerary={itinerary} />
    </div>
  );
}

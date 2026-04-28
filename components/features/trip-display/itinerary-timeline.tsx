"use client";

import { ActivityCard } from "./activity-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Itinerary } from "@/lib/store";
import { Sparkles } from "lucide-react";

export function ItineraryTimeline({ itinerary }: { itinerary: Itinerary }) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-8 p-4 lg:p-6">
        {itinerary.days.map((day) => (
          <section key={day.day}>
            {/* Day header */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  {day.day}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Day {day.day}
                  </h3>
                  <p className="text-xs text-muted-foreground">{day.date}</p>
                </div>
              </div>
              
              {day.expertTip && (
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-chart-3/10 px-3 py-1 border border-chart-3/20">
                  <Sparkles className="size-3 text-chart-3" />
                  <span className="text-[10px] font-medium text-chart-3 uppercase tracking-wider">Expert Tip</span>
                </div>
              )}
            </div>

            {/* Expert Tip for mobile or prominent display */}
            {day.expertTip && (
              <div className="mb-4 rounded-lg bg-chart-3/5 p-3 border border-chart-3/10">
                <p className="text-xs italic text-chart-3 leading-relaxed">
                  "{day.expertTip}"
                </p>
              </div>
            )}

            {/* Activities */}
            <div className="flex flex-col gap-3 pl-4 ml-4 border-l-2 border-border">
              {day.activities.map((activity, i) => (
                <ActivityCard key={activity.id} activity={activity} index={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </ScrollArea>
  );
}

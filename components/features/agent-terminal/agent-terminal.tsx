"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { generateTrip } from "@/lib/store";
import { t } from "@/lib/i18n";
import { CheckCircle2, Loader2, Circle, X } from "lucide-react";

const AGENT_STEPS = [
  { agent: "Flight Scanner", message: "Searching for optimal flight routes and prices..." },
  { agent: "Hotel Curator", message: "Cross-referencing hotels with ratings and availability..." },
  { agent: "Activity Planner", message: "Curating experiences based on your pace preference..." },
  { agent: "Budget Optimizer", message: "Optimizing your itinerary within budget constraints..." },
  { agent: "Local Expert", message: "Adding hidden gems and insider recommendations..." },
  { agent: "Weather Analyst", message: "Checking forecasts and preparing indoor alternatives..." },
  { agent: "Route Planner", message: "Building day-by-day timeline with smart routing..." },
];

export function AgentTerminal() {
  const router = useRouter();
  const locale = useAppStore((s) => s.locale);
  const setCurrentItinerary = useAppStore((s) => s.setCurrentItinerary);
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const paramsStr = sessionStorage.getItem("tripParams");
    if (!paramsStr) {
      router.push("/");
      return;
    }

    const params = JSON.parse(paramsStr);
    let step = 0;

    const interval = setInterval(() => {
      if (step < AGENT_STEPS.length) {
        setCompleted((prev) => [...prev, step]);
        step++;
        setActiveStep(step);
      } else {
        clearInterval(interval);
      }
    }, 800);

    // Generate trip in background
    generateTrip(params)
      .then((itinerary) => {
        setTimeout(() => {
          setCurrentItinerary(itinerary);
          sessionStorage.removeItem("tripParams");
          router.push(`/itinerary/${itinerary.id}`);
        }, Math.max(0, AGENT_STEPS.length * 800 + 400 - (Date.now() - startTime)));
      })
      .catch((err) => {
        console.error("Trip generation failed:", err);
        setError(err.message || "Failed to generate your trip. Please try again.");
      });

    const startTime = Date.now();
    return () => clearInterval(interval);
  }, [router, setCurrentItinerary]);

  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <X className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Generation Failed</h2>
          <p className="mb-8 text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            Back to Planner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Animated logo */}
        <div className="mb-8 flex justify-center">
          <svg viewBox="0 0 80 80" fill="none" className="size-20 text-primary animate-pulse" aria-hidden="true">
            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" className="animate-spin" style={{ animationDuration: "8s" }} />
            <circle cx="40" cy="40" r="24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" className="animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse" }} />
            <circle cx="40" cy="40" r="6" fill="currentColor" />
            {/* Orbiting dots */}
            <circle cx="40" cy="10" r="3" fill="currentColor" opacity="0.7" />
            <circle cx="66" cy="55" r="3" fill="currentColor" opacity="0.7" />
            <circle cx="14" cy="55" r="3" fill="currentColor" opacity="0.7" />
          </svg>
        </div>

        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
          {t(locale, "generating.title")}
        </h2>

        {/* Agent steps */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b bg-secondary/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-destructive/60" />
              <div className="size-3 rounded-full bg-chart-3/60" />
              <div className="size-3 rounded-full bg-accent/60" />
              <span className="ml-2 text-xs font-mono text-muted-foreground">
                autonmad-agents
              </span>
            </div>
          </div>
          <div className="divide-y">
            {AGENT_STEPS.map((step, i) => {
              const isDone = completed.includes(i);
              const isActive = activeStep === i;

              return (
                <div
                  key={step.agent}
                  className={`flex items-start gap-3 px-4 py-3 transition-all duration-300 ${
                    isDone
                      ? "bg-card"
                      : isActive
                      ? "bg-primary/5"
                      : "opacity-40"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="size-4 text-accent" />
                    ) : isActive ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {step.agent}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${((completed.length) / AGENT_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

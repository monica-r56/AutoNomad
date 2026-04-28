"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MapPin, Calendar, Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

function EmptyVaultSvg() {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      className="mx-auto mb-4 h-28 w-auto text-muted-foreground"
      aria-hidden="true"
    >
      {/* Open vault door */}
      <rect
        x="35"
        y="20"
        width="90"
        height="80"
        rx="6"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        fillOpacity="0.04"
      />
      {/* Door detail */}
      <rect
        x="45"
        y="30"
        width="70"
        height="60"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
      />
      {/* Handle circle */}
      <circle
        cx="80"
        cy="60"
        r="12"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      <circle
        cx="80"
        cy="60"
        r="3"
        fill="currentColor"
        opacity="0.2"
      />
      {/* Sparkle */}
      <path
        d="M130 25 L132 30 L137 32 L132 34 L130 39 L128 34 L123 32 L128 30 Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M25 50 L27 53 L30 55 L27 57 L25 60 L23 57 L20 55 L23 53 Z"
        fill="currentColor"
        opacity="0.15"
      />
    </svg>
  );
}

export function TripVault() {
  const locale = useAppStore((s) => s.locale);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setShowAuthModal = useAppStore((s) => s.setShowAuthModal);
  const savedTrips = useAppStore((s) => s.savedTrips);
  const currentItinerary = useAppStore((s) => s.currentItinerary);

  // Auth gate: show auth modal if not signed in
  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true, "/vault");
    }
  }, [isAuthenticated, setShowAuthModal]);

  // Combine saved trips with current draft
  const allTrips = [
    ...(currentItinerary ? [currentItinerary] : []),
    ...savedTrips.filter((t) => t.id !== currentItinerary?.id),
  ];

  if (allTrips.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <EmptyVaultSvg />
        <h2 className="text-lg font-bold text-foreground">
          {t(locale, "vault.empty")}
        </h2>
        <Link href="/">
          <Button className="mt-4">{t(locale, "form.generate")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {t(locale, "vault.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t(locale, "vault.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allTrips.map((trip) => (
          <Link
            key={trip.id}
            href={`/itinerary/${trip.id}`}
            className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
          >
            {/* Card image */}
            <div className="relative h-40 overflow-hidden">
              <img
                src="/images/stockholm.jpg"
                alt={`Trip to ${trip.destination}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <p className="text-lg font-bold text-card">
                  {trip.destination}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`absolute top-3 right-3 border-card/30 text-card ${
                  trip.status === "booked"
                    ? "bg-accent/80"
                    : trip.status === "saved"
                    ? "bg-primary/80"
                    : "bg-muted-foreground/60"
                }`}
              >
                {trip.status}
              </Badge>
            </div>

            {/* Card content */}
            <div className="p-4">
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0" />
                  <span>
                    {trip.origin} → {trip.destination}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>
                    {trip.departureDate} &middot; {trip.days.length} days
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-3.5 shrink-0" />
                  <span>
                    {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="font-semibold text-foreground">
                  {trip.currency} {trip.totalCost.toLocaleString()}
                </p>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

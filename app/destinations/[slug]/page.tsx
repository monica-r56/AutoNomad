"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  DollarSign,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDestinationBySlug } from "@/lib/popular-destinations";
import { useAppStore } from "@/lib/store";
import { InteractiveMap } from "@/components/interactive-map";

export default function DestinationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useAppStore((s) => s.locale);

  const destination = useMemo(() => {
    const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
    return getDestinationBySlug(slug);
  }, [params]);

  if (!destination) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Destination Not Found</h1>
          <Button
            onClick={() => router.push("/destinations")}
            className="mt-4"
            variant="outline"
          >
            Back to Destinations
          </Button>
        </div>
      </div>
    );
  }

  // Convert attractions to activity format for map
  const mapActivities = destination.attractions.map((attraction, idx) => ({
    id: `${destination.id}-attr-${idx}`,
    type: (attraction.type as any) || "activity",
    title: attraction.name,
    description: attraction.description,
    time: "TBD",
    duration: attraction.estimatedTime,
    cost: attraction.cost,
    currency: "USD",
    image: destination.image,
    badges: [] as any[],
    isOutdoor: attraction.isOutdoor,
    location: {
      lat:
        destination.coordinates.lat +
        (Math.random() - 0.5) * 0.05,
      lng:
        destination.coordinates.lng +
        (Math.random() - 0.5) * 0.05,
    },
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero section */}
      <div className="relative h-[400px] overflow-hidden">
        <img
          src={destination.image}
          alt={destination.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />

        {/* Header overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold text-white">{destination.name}</h1>
            <p className="mt-2 text-lg text-white/90">
              {destination.country}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Description and key info */}
          <div className="mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {destination.description}
            </p>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-card p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="size-4" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <p className="text-xl font-bold">
                  {destination.estimatedDays} days
                </p>
              </div>

              <div className="rounded-lg bg-card p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="size-4" />
                  <span className="text-sm font-medium">Budget</span>
                </div>
                <p className="text-sm font-bold">
                  {destination.estimatedBudget.min.toLocaleString()}-
                  <br />
                  {destination.estimatedBudget.max.toLocaleString()} {destination.estimatedBudget.currency}
                </p>
              </div>

              <div className="rounded-lg bg-card p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="size-4" />
                  <span className="text-sm font-medium">Best Time</span>
                </div>
                <p className="text-sm font-bold">{destination.bestTime}</p>
              </div>

              <div className="rounded-lg bg-card p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <AlertCircle className="size-4" />
                  <span className="text-sm font-medium">Attractions</span>
                </div>
                <p className="text-xl font-bold">
                  {destination.attractions.length}
                </p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Top Highlights</h2>
            <div className="flex flex-wrap gap-2">
              {destination.highlights.map((highlight) => (
                <Badge
                  key={highlight}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                >
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>

          {/* Attractions */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Must-See Attractions</h2>
            <div className="grid grid-cols-1 gap-4">
              {destination.attractions.map((attraction, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {attraction.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {attraction.type}
                      </p>
                      <p className="text-sm leading-relaxed">
                        {attraction.description}
                      </p>
                      <div className="mt-3 flex gap-3 flex-wrap">
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Clock className="size-3" />
                          {attraction.estimatedTime}
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs">
                          <DollarSign className="size-3" />
                          ${attraction.cost}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {attraction.isOutdoor ? "🌞 Outdoor" : "🏠 Indoor"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Location Map</h2>
            <div className="rounded-lg border overflow-hidden" style={{ height: "500px" }}>
              <InteractiveMap
                activities={mapActivities}
                destination={destination.name}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to explore?</h2>
            <p className="text-muted-foreground mb-6">
              Start planning your trip to {destination.name} with AutoNomad
            </p>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => router.push("/")}
            >
              Plan Your Trip
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

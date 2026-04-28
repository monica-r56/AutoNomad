"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Clock, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAllDestinations,
  type PopularDestination,
} from "@/lib/popular-destinations";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function DestinationsPage() {
  const locale = useAppStore((s) => s.locale);
  const [destinations, setDestinations] = useState(getAllDestinations());
  const [selectedDest, setSelectedDest] = useState<string | null>(null);

  const removeDestination = (id: string) => {
    setDestinations(destinations.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-foreground">
            Popular Destinations
          </h1>
          <p className="mt-2 text-muted-foreground">
            Explore curated itineraries and get inspired for your next adventure
          </p>
        </div>
      </div>

      {/* Destinations grid */}
      <div className="px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {destinations.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="size-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                No destinations yet. Add some to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination) => (
                <div
                  key={destination.id}
                  onClick={() => setSelectedDest(destination.id)}
                  className="group relative overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <img
                      src={destination.image}
                      alt={destination.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDestination(destination.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-destructive/90 hover:bg-destructive text-destructive-foreground transition-colors"
                      aria-label="Remove destination"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    {/* Name overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h2 className="text-xl font-bold text-white">
                        {destination.name}
                      </h2>
                      <p className="text-sm text-white/80">{destination.country}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {destination.description}
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="size-3" />
                        {destination.estimatedDays} days
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <DollarSign className="size-3" />
                        {destination.estimatedBudget.min.toLocaleString()}-
                        {destination.estimatedBudget.max.toLocaleString()}
                      </Badge>
                    </div>

                    {/* Highlights */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Highlights
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {destination.highlights.slice(0, 3).map((highlight) => (
                          <Badge
                            key={highlight}
                            variant="secondary"
                            className="text-xs"
                          >
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <Link href={`/destinations/${destination.slug}`}>
                      <Button className="w-full gap-2" variant="default">
                        Explore
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

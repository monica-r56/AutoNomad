"use client";

import { useEffect, useRef } from "react";
import { MapPin, AlertCircle } from "lucide-react";
import type { Activity } from "@/lib/store";

interface InteractiveMapProps {
  activities: Activity[];
  destination: string;
  isLoading?: boolean;
}

export function InteractiveMap({
  activities,
  destination,
  isLoading = false,
}: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || !activities.length) return;
    const container = mapContainer.current;

    // Dynamically import Leaflet to avoid SSR issues
    if (typeof window === "undefined") return;

    import("leaflet").then((L) => {

      if (map.current) {
        map.current.remove();
      }

      // Calculate bounds from activities
      const lats = activities.map((a) => a.location.lat);
      const lngs = activities.map((a) => a.location.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      // Initialize map
      map.current = L.map(container).setView(
        [centerLat, centerLng],
        12
      );

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Add activity markers with numbers
      activities.forEach((activity, index) => {
        const markerHtml = `
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-sm border-2 border-white shadow-lg">
            ${index + 1}
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: "custom-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([activity.location.lat, activity.location.lng], {
          icon: customIcon,
          title: activity.title,
        })
          .bindPopup(
            `<div class="text-sm"><strong>${activity.title}</strong><p>${activity.description}</p></div>`
          )
          .addTo(map.current);
      });

      // Draw dotted lines between consecutive activities (route visualization)
      for (let i = 0; i < activities.length - 1; i++) {
        const from = activities[i].location;
        const to = activities[i + 1].location;

        L.polyline(
          [
            [from.lat, from.lng],
            [to.lat, to.lng],
          ],
          {
            color: "#2563eb",
            weight: 2,
            opacity: 0.6,
            dashArray: "5, 5",
          }
        ).addTo(map.current);
      }

      // Fit bounds to show all markers
      const bounds = L.latLngBounds(
        activities.map((a) => [a.location.lat, a.location.lng])
      );
      map.current.fitBounds(bounds, { padding: [50, 50] });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [activities]);

  if (isLoading) {
    return (
      <div className="relative h-full rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-3">◐</div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="relative h-full rounded-xl bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20">
        <MapPin className="size-12 text-muted-foreground/40 mb-3" />
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary border border-primary/20">
          <AlertCircle className="size-3" />
          Map coming soon
        </span>
        <p className="mt-3 text-sm text-muted-foreground">
          Activities will appear on the map
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-xl overflow-hidden border bg-muted">
      <div
        ref={mapContainer}
        className="h-full w-full"
        style={{ minHeight: "400px" }}
      />
      <style>{`
        .leaflet-container {
          font-family: inherit;
        }
        .custom-marker {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
      `}</style>
    </div>
  );
}

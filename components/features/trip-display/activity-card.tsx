"use client";

import { useState } from "react";
import {
  Plane,
  Hotel,
  MapPin,
  Bus,
  Utensils,
  CloudRain,
  Star,
  Zap,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Activity, Badge as BadgeType } from "@/lib/store";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const TYPE_ICONS: Record<Activity["type"], typeof Plane> = {
  flight: Plane,
  hotel: Hotel,
  activity: MapPin,
  transport: Bus,
  food: Utensils,
};

const BADGE_CONFIG: Record<BadgeType, { label: string; icon: typeof Star; className: string }> = {
  "hidden-gem": {
    label: "Hidden Gem",
    icon: Sparkles,
    className: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  },
  cheapest: {
    label: "Cheapest",
    icon: DollarSign,
    className: "bg-accent/15 text-accent border-accent/30",
  },
  fastest: {
    label: "Fastest",
    icon: Zap,
    className: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  },
  "top-rated": {
    label: "Top Rated",
    icon: Star,
    className: "bg-primary/15 text-primary border-primary/30",
  },
};

export function ActivityCard({
  activity,
  index,
}: {
  activity: Activity;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const locale = useAppStore((s) => s.locale);
  const Icon = TYPE_ICONS[activity.type] || MapPin;

  if (flipped && activity.indoorAlternative) {
    return (
      <div className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="bg-primary/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudRain className="size-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {t(locale, "dashboard.planB")}
              </span>
            </div>
            <button
              onClick={() => setFlipped(false)}
              className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
        <div className="p-4">
          <h4 className="font-semibold text-foreground">
            {activity.indoorAlternative.title}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {activity.indoorAlternative.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Image + type icon */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={activity.image}
          alt={activity.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        <div className="absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-lg bg-card/90 shadow-sm backdrop-blur-sm">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
          {index + 1}
        </div>
        {/* Source Link on Hover */}
        {activity.sourceUrl && (
          <a
            href={activity.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-x-0 top-0 bg-background/80 py-1 text-center text-[10px] font-medium text-primary opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
          >
            Source: {new URL(activity.sourceUrl).hostname}
          </a>
        )}
        {/* Plan B toggle */}
        {activity.isOutdoor && activity.indoorAlternative && (
          <button
            onClick={() => setFlipped(true)}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-card/90 px-2 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
            aria-label="Show indoor alternative"
          >
            <CloudRain className="size-3" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5">
        {/* Badges */}
        {activity.badges.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {Array.from(new Set(activity.badges)).map((b, i) => {
              const config = BADGE_CONFIG[b];
              const BadgeIcon = config.icon;
              return (
                <Badge
                  key={`${b}-${i}`}
                  variant="outline"
                  className={`gap-1 py-0.5 text-[10px] ${config.className}`}
                >
                  <BadgeIcon className="size-2.5" />
                  {config.label}
                </Badge>
              );
            })}
          </div>
        )}

        <h4 className="font-semibold text-foreground leading-snug">
          {activity.title}
        </h4>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {activity.description}
        </p>

        <div className="mt-3 flex items-center text-xs text-muted-foreground">
          <span>
            {activity.time} &middot; {activity.duration}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { MagicWandForm } from "@/components/magic-wand-form";
import { MapPin, Sparkles, Shield } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  { icon: Sparkles, label: "AI-Powered Agents" },
  { icon: MapPin, label: "Smart Routing" },
  { icon: Shield, label: "Best Price Guarantee" },
];

export function HeroSection() {
  const locale = useAppStore((s) => s.locale);

  return (
    <section className="relative overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t(locale, "hero.tagline")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted-foreground leading-relaxed">
            {t(locale, "hero.subtitle")}
          </p>

          {/* Feature pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 rounded-full bg-card/80 px-3.5 py-1.5 text-sm font-medium text-card-foreground shadow-sm backdrop-blur-sm"
              >
                <f.icon className="size-4 text-primary" />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Magic Wand Form */}
        <div className="mx-auto mt-10 max-w-3xl">
          <MagicWandForm />
        </div>
      </div>

      {/* Destination highlights */}
      <div className="relative bg-background pb-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Popular destinations</h2>
            <Link href="/destinations" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { name: "Switzerland", img: "/images/destination-switzerland.jpg", tag: "Alpine Beauty" },
              { name: "Sweden", img: "/images/destination-sweden.jpg", tag: "Nordic Charm" },
              { name: "London", img: "/images/destination-london.jpg", tag: "Historic Elegance" },
            ].map((dest) => (
              <Link
                key={dest.name}
                href="/destinations"
                className="group relative overflow-hidden rounded-xl shadow-sm cursor-pointer"
              >
                <img
                  src={dest.img}
                  alt={`${dest.name} - ${dest.tag}`}
                  className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-lg font-semibold text-card">{dest.name}</p>
                  <p className="text-sm text-card/80">{dest.tag}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

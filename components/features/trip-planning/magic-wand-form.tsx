"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plane,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Zap,
  Leaf,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPicker } from "@/components/features/trip-planning/location-picker";
import { GenerateTripButton } from "@/components/features/trip-planning/generate-trip-button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { LocationResult } from "@/lib/location-search";

const CURRENCIES = ["USD", "EUR", "GBP", "SEK", "NOK", "CHF", "JPY", "INR"];

export function MagicWandForm() {
  const [mounted, setMounted] = useState(false);
  const locale = useAppStore((s) => s.locale);

  useEffect(() => {
    setMounted(true);
  }, []);
  const preferences = useAppStore((s) => s.preferences);
  const router = useRouter();

  const [form, setForm] = useState({
    origin: "",
    originLocation: null as LocationResult | null,
    destination: "",
    destinationLocation: null as LocationResult | null,
    departureDate: "",
    duration: 5,
    travelers: 2,
    budget: 3000,
    currency: "USD", // Stable default
    pace: "slow" as "fast" | "slow",
  });

  // Sync preferences after mount to avoid hydration mismatch
  useEffect(() => {
    if (mounted && preferences.defaultCurrency) {
      setForm(prev => ({ ...prev, currency: preferences.defaultCurrency }));
    }
  }, [mounted, preferences.defaultCurrency]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!form.originLocation) errs.origin = "Select a valid location";
    if (!form.destinationLocation) errs.destination = "Select a valid location";
    if (!form.departureDate) errs.departureDate = "Required";
    if (form.duration < 1 || form.duration > 30)
      errs.duration = "1-30 days";
    if (form.travelers < 1 || form.travelers > 20) errs.travelers = "1-20 travelers";
    if (form.budget < 100) errs.budget = "Minimum $100";

    const dep = new Date(form.departureDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dep < today) {
      errs.departureDate = "Must be in the future";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;

    sessionStorage.setItem(
      "tripParams",
      JSON.stringify({
        ...form,
        origin: form.originLocation?.iataCode || form.originLocation?.displayName || form.origin,
        destination: form.destinationLocation?.iataCode || form.destinationLocation?.displayName || form.destination,
        originName: form.originLocation?.name,
        destinationName: form.destinationLocation?.name,
      })
    );
    router.push("/trips/generating");
  };

  const updateField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border bg-card/95 backdrop-blur-sm p-8 shadow-2xl"
    >
      {/* Location row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
        <div className="flex flex-col gap-2">
          {mounted && (
            <Label htmlFor="origin" className="text-sm font-semibold">
              <Plane className="inline size-4 mr-2" />
              {t(locale, "form.origin")}
            </Label>
          )}
          <LocationPicker
            value={form.origin}
            onChange={(location) => {
              updateField("originLocation", location);
              updateField("origin", location.displayName);
            }}
            placeholder="e.g., Delhi, New York..."
            icon={<Plane className="size-4" />}
          />
          {errors.origin && (
            <p className="text-xs text-destructive">{errors.origin}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {mounted && (
            <Label htmlFor="destination" className="text-sm font-semibold">
              <MapPin className="inline size-4 mr-2" />
              {t(locale, "form.destination")}
            </Label>
          )}
          <LocationPicker
            value={form.destination}
            onChange={(location) => {
              updateField("destinationLocation", location);
              updateField("destination", location.displayName);
            }}
            placeholder="e.g., Stockholm, Tokyo..."
            icon={<MapPin className="size-4" />}
          />
          {errors.destination && (
            <p className="text-xs text-destructive">{errors.destination}</p>
          )}
        </div>
      </div>

      {/* Date and Duration row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
        <div className="flex flex-col gap-2">
          {mounted && (
            <Label htmlFor="departure" className="text-sm font-semibold">
              <Calendar className="inline size-4 mr-2" />
              {t(locale, "form.departure")}
            </Label>
          )}
          <Input
            id="departure"
            type="date"
            value={form.departureDate}
            onChange={(e) => updateField("departureDate", e.target.value)}
            aria-invalid={!!errors.departureDate}
            className="rounded-lg"
          />
          {errors.departureDate && (
            <p className="text-xs text-destructive">{errors.departureDate}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {mounted && (
            <Label htmlFor="duration" className="text-sm font-semibold">
              <Calendar className="inline size-4 mr-2" />
              {t(locale, "form.duration")}
            </Label>
          )}
          <Input
            id="duration"
            type="number"
            min={1}
            max={30}
            value={form.duration}
            onChange={(e) => updateField("duration", Number(e.target.value))}
            aria-invalid={!!errors.duration}
            className="rounded-lg"
          />
          {errors.duration && (
            <p className="text-xs text-destructive">{errors.duration}</p>
          )}
        </div>
      </div>

      {/* Travelers and Budget row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
        <div className="flex flex-col gap-2">
          {mounted && (
            <Label htmlFor="travelers" className="text-sm font-semibold">
              <Users className="inline size-4 mr-2" />
              {t(locale, "form.travelers")}
            </Label>
          )}
          <Input
            id="travelers"
            type="number"
            min={1}
            max={20}
            value={form.travelers}
            onChange={(e) => updateField("travelers", Number(e.target.value))}
            aria-invalid={!!errors.travelers}
            className="rounded-lg"
          />
          {errors.travelers && (
            <p className="text-xs text-destructive">{errors.travelers}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {mounted && (
            <Label htmlFor="budget" className="text-sm font-semibold">
              <DollarSign className="inline size-4 mr-2" />
              {t(locale, "form.budget")}
            </Label>
          )}
          <div className="flex gap-2">
            <Input
              id="budget"
              type="number"
              min={100}
              value={form.budget}
              onChange={(e) => updateField("budget", Number(e.target.value))}
              className="flex-1 rounded-lg"
              aria-invalid={!!errors.budget}
            />
            {mounted && (
              <Select
                value={form.currency}
                onValueChange={(val) => updateField("currency", val)}
              >
                <SelectTrigger className="w-24 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {errors.budget && (
            <p className="text-xs text-destructive">{errors.budget}</p>
          )}
        </div>
      </div>

      {/* Travel Pace - Side by side selection */}
      <div className="mb-8">
        {mounted && (
          <Label className="text-sm font-semibold mb-3 block">
            <Zap className="inline size-4 mr-2" />
            {t(locale, "form.pace")}
          </Label>
        )}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateField("pace", "fast")}
            className={`py-4 px-4 rounded-xl border-2 transition-all duration-200 ${
              form.pace === "fast"
                ? "border-primary bg-primary/10 shadow-lg"
                : "border-border bg-muted/40 hover:border-primary/50"
            }`}
          >
            <Zap className="inline size-5 mr-2" />
            <span className="font-semibold">{t(locale, "form.paceFast")}</span>
            <p className="text-xs text-muted-foreground mt-1">
              See everything fast
            </p>
          </button>

          <button
            type="button"
            onClick={() => updateField("pace", "slow")}
            className={`py-4 px-4 rounded-xl border-2 transition-all duration-200 ${
              form.pace === "slow"
                ? "border-primary bg-primary/10 shadow-lg"
                : "border-border bg-muted/40 hover:border-primary/50"
            }`}
          >
            <Leaf className="inline size-5 mr-2" />
            <span className="font-semibold">{t(locale, "form.paceSlow")}</span>
            <p className="text-xs text-muted-foreground mt-1">
              Explore like a local
            </p>
          </button>
        </div>
      </div>

      {/* Submit button */}
      <GenerateTripButton onClick={() => handleSubmit()} />
    </form>
  );
}

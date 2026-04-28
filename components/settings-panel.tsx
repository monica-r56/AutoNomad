"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const CURRENCIES = ["USD", "EUR", "GBP", "SEK", "NOK", "CHF", "JPY", "INR"];

export function SettingsPanel() {
  const showSettings = useAppStore((s) => s.showSettings);
  const setShowSettings = useAppStore((s) => s.setShowSettings);
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const locale = useAppStore((s) => s.locale);

  return (
    <Sheet open={showSettings} onOpenChange={setShowSettings}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t(locale, "settings.title")}</SheetTitle>
          <SheetDescription>
            Configure your travel preferences to help our AI agents personalize your trips.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currency">{t(locale, "settings.currency")}</Label>
            <Select
              value={preferences.defaultCurrency}
              onValueChange={(val) => setPreferences({ defaultCurrency: val })}
            >
              <SelectTrigger id="currency">
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
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="airport">{t(locale, "settings.airport")}</Label>
            <Input
              id="airport"
              placeholder="e.g., STO, LHR, JFK"
              value={preferences.homeAirport}
              onChange={(e) => setPreferences({ homeAirport: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="passport">{t(locale, "settings.passport")}</Label>
            <Input
              id="passport"
              placeholder="e.g., Sweden, United States"
              value={preferences.passportCountry}
              onChange={(e) => setPreferences({ passportCountry: e.target.value })}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { CreditCard, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Itinerary } from "@/lib/store";

export function ActionBar({ itinerary }: { itinerary: Itinerary }) {
  const locale = useAppStore((s) => s.locale);
  const splitCost = useAppStore((s) => s.splitCost);
  const setSplitCost = useAppStore((s) => s.setSplitCost);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setShowAuthModal = useAppStore((s) => s.setShowAuthModal);

  const displayCost = splitCost
    ? Math.round(itinerary.totalCost / itinerary.travelers)
    : itinerary.totalCost;

  const handleAuthGated = (action: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // In production, handle the actual action
    console.log(`[v0] ${action} triggered`);
  };

  return (
    <div className="sticky bottom-0 z-40 border-t bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        {/* Cost display */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">
              {t(locale, "dashboard.totalCost")}
            </p>
            <p className="text-xl font-bold text-foreground">
              {itinerary.currency} {displayCost.toLocaleString()}
              {splitCost && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {t(locale, "dashboard.perPerson")}
                </span>
              )}
            </p>
          </div>

          {/* Split toggle */}
          {itinerary.travelers > 1 && (
            <div className="flex items-center gap-2">
              <Switch
                id="split-cost"
                checked={splitCost}
                onCheckedChange={setSplitCost}
              />
              <Label htmlFor="split-cost" className="text-xs text-muted-foreground cursor-pointer">
                <Users className="mr-1 inline-block size-3" />
                {t(locale, "dashboard.splitCost")}
              </Label>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => handleAuthGated("download-pdf")}
          >
            <Download className="size-4" />
            {t(locale, "dashboard.downloadPdf")}
          </Button>
          <Button
            className="gap-1.5"
            onClick={() => handleAuthGated("book-now")}
          >
            <CreditCard className="size-4" />
            {t(locale, "dashboard.bookNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import Link from "next/link";

export function ErrorState() {
  const locale = useAppStore((s) => s.locale);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {/* Friendly error SVG */}
      <svg
        viewBox="0 0 160 140"
        fill="none"
        className="mb-6 h-36 w-auto text-muted-foreground"
        aria-hidden="true"
      >
        {/* Suitcase */}
        <rect
          x="40"
          y="50"
          width="80"
          height="60"
          rx="8"
          stroke="currentColor"
          strokeWidth="3"
          fill="currentColor"
          fillOpacity="0.05"
        />
        <rect
          x="60"
          y="38"
          width="40"
          height="16"
          rx="4"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        {/* X on suitcase */}
        <line
          x1="68"
          y1="70"
          x2="92"
          y2="94"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
        <line
          x1="92"
          y1="70"
          x2="68"
          y2="94"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* Question marks */}
        <text
          x="130"
          y="52"
          fontSize="20"
          fill="currentColor"
          opacity="0.3"
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          {"?"}
        </text>
        <text
          x="22"
          y="68"
          fontSize="16"
          fill="currentColor"
          opacity="0.2"
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          {"?"}
        </text>
        {/* Ground */}
        <line
          x1="20"
          y1="115"
          x2="140"
          y2="115"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.15"
        />
      </svg>

      <h2 className="text-xl font-bold text-foreground">
        {t(locale, "error.title")}
      </h2>
      <p className="mt-2 max-w-md text-pretty text-muted-foreground leading-relaxed">
        {t(locale, "error.subtitle")}
      </p>
      <Link href="/">
        <Button className="mt-6">{t(locale, "error.retry")}</Button>
      </Link>
    </div>
  );
}

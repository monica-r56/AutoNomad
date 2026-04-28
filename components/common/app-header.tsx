"use client";

import { useTheme } from "next-themes";
import { Globe, Moon, Sun, Archive, Settings, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AutoNomadLogo } from "@/components/common/auto-nomad-logo";
import { useAppStore } from "@/lib/store";
import { LOCALES, t } from "@/lib/i18n";
import Link from "next/link";
import { useState, useEffect } from "react";

export function AppHeader() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const locale = useAppStore((s) => s.locale);
   const setLocale = useAppStore((s) => s.setLocale);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setShowAuthModal = useAppStore((s) => s.setShowAuthModal);
  const setShowSettings = useAppStore((s) => s.setShowSettings);
  const user = useAppStore((s) => s.user);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo - Clickable to go home */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity duration-300 group">
          <AutoNomadLogo className="size-8" />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-foreground">Auto</span>
            <span className="text-primary">Nomad</span>
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Destinations link */}
          <Link href="/destinations">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <MapPin className="size-4" />
              <span className="hidden sm:inline">Destinations</span>
            </Button>
          </Link>

          {/* Vault link */}
          <Link href="/trip-vault">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <Archive className="size-4" />
              <span className="hidden sm:inline">{t(locale, "nav.vault")}</span>
            </Button>
          </Link>

          {mounted ? (
            <>
              {/* Settings */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowSettings(true)}
                aria-label={t(locale, "nav.settings")}
                className="text-muted-foreground"
              >
                <Settings className="size-4" />
              </Button>

              {/* Locale dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Change language" className="text-muted-foreground">
                    <Globe className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-36">
                  {LOCALES.map((loc) => (
                    <DropdownMenuItem
                      key={loc.code}
                      onClick={() => setLocale(loc.code)}
                      className={locale === loc.code ? "bg-secondary font-medium" : ""}
                    >
                      {loc.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
                className="text-muted-foreground"
              >
                <Sun className="size-4 scale-100 rotate-0 dark:scale-0 dark:-rotate-90 transition-transform" />
                <Moon className="absolute size-4 scale-0 rotate-90 dark:scale-100 dark:rotate-0 transition-transform" />
              </Button>

              {/* Auth */}
              {isAuthenticated && user ? (
                <div className="ml-1 flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <Button
                  size="sm"
                  className="ml-1"
                  onClick={() => setShowAuthModal(true)}
                >
                  {t(locale, "nav.signIn")}
                </Button>
              )}
            </>
          ) : (
            <div className="w-32 h-8 animate-pulse bg-muted rounded-md" />
          )}
        </div>
      </div>
    </header>
  );
}

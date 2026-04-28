"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function AuthSvg() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 h-24 w-auto text-primary" aria-hidden="true">
      {/* Shield */}
      <path
        d="M60 8 L95 25 V55 C95 75 80 90 60 95 C40 90 25 75 25 55 V25 Z"
        stroke="currentColor"
        strokeWidth="3"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Checkmark */}
      <path
        d="M42 52 L55 65 L78 38"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lock */}
      <rect x="50" y="70" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
      <path d="M54 70 V64 A6 6 0 0 1 66 64 V70" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function AuthModal() {
  const [mounted, setMounted] = useState(false);
  const showAuthModal = useAppStore((s) => s.showAuthModal);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setShowAuthModal = useAppStore((s) => s.setShowAuthModal);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);
  const setUser = useAppStore((s) => s.setUser);
  const authRedirectPath = useAppStore((s) => s.authRedirectPath);
  const locale = useAppStore((s) => s.locale);
  const router = useRouter();

  if (!mounted) return null;

  const handleSignIn = () => {
    // TODO: Replace with real Google OAuth integration
    // 1. Add @react-oauth/google package
    // 2. Wrap app with GoogleOAuthProvider
    // 3. Use GoogleLogin component with onSuccess callback
    // 4. Send token to backend: POST /api/v1/auth/google with token
    // 5. Backend validates token and creates session

    setUser({
      name: "Alex Traveler",
      email: "alex@example.com",
      avatar: "",
    });
    setAuthenticated(true);
    setShowAuthModal(false);
    if (authRedirectPath) {
      router.push(authRedirectPath);
    }
  };

  return (
    <Dialog open={showAuthModal} onOpenChange={(open) => setShowAuthModal(open)}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <AuthSvg />
          <DialogTitle className="text-xl">{t(locale, "auth.title")}</DialogTitle>
          <DialogDescription className="text-pretty">
            {t(locale, "auth.subtitle")}
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleSignIn} className="mt-2 w-full gap-2" size="lg">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t(locale, "auth.google")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

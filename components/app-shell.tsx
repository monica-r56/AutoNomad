"use client";

import { AppHeader } from "@/components/app-header";
import { AuthModal } from "@/components/auth-modal";
import { SettingsPanel } from "@/components/settings-panel";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <AuthModal />
      <SettingsPanel />
    </div>
  );
}

"use client";

import { AppHeader } from "@/components/common/app-header";
import { AuthModal } from "@/components/features/auth/auth-modal";
import { SettingsPanel } from "@/components/features/settings/settings-panel";

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

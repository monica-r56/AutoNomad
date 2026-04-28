import { AppShell } from "@/components/common/app-shell";
import { ItineraryDashboard } from "@/components/features/trip-display";

export default function ItineraryPage() {
  return (
    <AppShell>
      <ItineraryDashboard />
    </AppShell>
  );
}

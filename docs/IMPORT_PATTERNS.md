# AutoNomad - Import Patterns & Guidelines

This guide shows the correct import patterns for the restructured AutoNomad project.

## Common Component Imports

### Layout Components (From `components/common`)

```typescript
// App Shell & Header
import { AppShell, AppHeader, AutoNomadLogo } from "@/components/common";

// Or individual imports
import { AppShell } from "@/components/common";
import { AppHeader } from "@/components/common";
```

**Location:** `/components/common/index.ts`

**Files:**
- `app-header.tsx` - Navigation bar
- `app-shell.tsx` - Root layout wrapper
- `auto-nomad-logo.tsx` - Logo SVG component

---

### Feature: Trip Planning

```typescript
// All trip planning components
import { 
  MagicWandForm, 
  LocationPicker, 
  GenerateTripButton 
} from "@/components/features/trip-planning";

// Or individual imports
import { MagicWandForm } from "@/components/features/trip-planning";
import { LocationPicker } from "@/components/features/trip-planning/location-picker";
```

**Location:** `/components/features/trip-planning/index.ts`

**Files:**
- `magic-wand-form.tsx` - Main trip form (location, date, budget, etc.)
- `location-picker.tsx` - Location search dropdown
- `generate-trip-button.tsx` - Submit button with animation

**Used In:**
- `components/features/homepage/hero-section.tsx`
- Page components

---

### Feature: Homepage

```typescript
import { HeroSection } from "@/components/features/homepage";
```

**Location:** `/components/features/homepage/index.ts`

**Files:**
- `hero-section.tsx` - Landing page hero with form and destination preview

**Used In:**
- `app/page.tsx`

---

### Feature: Authentication

```typescript
import { AuthModal } from "@/components/features/auth";
```

**Location:** `/components/features/auth/index.ts`

**Files:**
- `auth-modal.tsx` - Google OAuth modal dialog

**Used In:**
- `components/common/app-shell.tsx`

---

### Feature: Settings

```typescript
import { SettingsPanel } from "@/components/features/settings";
```

**Location:** `/components/features/settings/index.ts`

**Files:**
- `settings-panel.tsx` - User preferences panel (currency, airport, passport)

**Used In:**
- `components/common/app-shell.tsx`

---

## Ready-to-Migrate Components

These components will be reorganized. Update imports after migration:

### Trip Display Feature (Coming Soon)

```typescript
// Will be available at:
import { 
  ItineraryDashboard, 
  ItineraryTimeline, 
  ActivityCard, 
  InteractiveMap, 
  ActionBar, 
  ErrorState 
} from "@/components/features/trip-display";

// Current location (BEFORE migration):
import { ItineraryDashboard } from "@/components/itinerary-dashboard";
```

### Agent Terminal Feature (Coming Soon)

```typescript
// Will be available at:
import { AgentTerminal } from "@/components/features/agent-terminal";

// Current location (BEFORE migration):
import { AgentTerminal } from "@/components/agent-terminal";
```

### Trip Vault Feature (Coming Soon)

```typescript
// Will be available at:
import { TripVault } from "@/components/features/trip-vault";

// Current location (BEFORE migration):
import { TripVault } from "@/components/trip-vault";
```

---

## UI Component Imports (Unchanged)

All shadcn UI components stay in their original location:

```typescript
// Buttons, dialogs, forms, etc.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";

// ... 50+ other components available in components/ui/
```

---

## Library & Utility Imports

```typescript
// State Management
import { useAppStore } from "@/lib/store";

// Internationalization
import { t, LOCALES } from "@/lib/i18n";

// Location Search
import { searchLocations, type LocationResult } from "@/lib/location-search";

// Route Optimization
import { optimizeRoute, type OptimizedRoute } from "@/lib/route-optimizer";

// Popular Destinations
import { getAllDestinations, type PopularDestination } from "@/lib/popular-destinations";

// Utilities
import { cn } from "@/lib/utils";

// Custom Hooks
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

// Next.js & React
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useCallback } from "react";
import { useTheme } from "next-themes";
```

---

## Real-World Examples

### Example 1: Homepage Page Component

```typescript
// app/page.tsx
import { AppShell } from "@/components/common";
import { HeroSection } from "@/components/features/homepage";

export default function HomePage() {
  return (
    <AppShell>
      <HeroSection />
    </AppShell>
  );
}
```

### Example 2: Destinations Browse Page

```typescript
// app/browse/destinations/page.tsx
import { AppShell } from "@/components/common";
import { useState } from "react";
import { getAllDestinations } from "@/lib/popular-destinations";
import { useAppStore } from "@/lib/store";

export default function BrowseDestinationsPage() {
  const locale = useAppStore((s) => s.locale);
  const [destinations, setDestinations] = useState(getAllDestinations());

  return (
    <AppShell>
      {/* Destination grid */}
    </AppShell>
  );
}
```

### Example 3: Creating a New Feature Component

When creating a new feature (e.g., "reviews"):

```typescript
// components/features/reviews/review-card.tsx
export function ReviewCard({ review }) {
  return (
    // Component JSX
  );
}

// components/features/reviews/review-list.tsx
import { ReviewCard } from "./review-card";

export function ReviewList({ reviews }) {
  return reviews.map(review => (
    <ReviewCard key={review.id} review={review} />
  ));
}

// components/features/reviews/index.ts (BARREL EXPORT)
export { ReviewCard } from "./review-card";
export { ReviewList } from "./review-list";

// Now use it elsewhere:
import { ReviewCard, ReviewList } from "@/components/features/reviews";
```

---

## Import Anti-Patterns (Don't Do This)

```typescript
// ❌ DON'T: Long relative paths
import { MagicWandForm } from "../../../components/features/trip-planning/magic-wand-form";

// ❌ DON'T: Default imports when named exports exist
import MagicWandForm from "@/components/features/trip-planning";

// ❌ DON'T: Import from component files directly (when barrel exists)
import { MagicWandForm } from "@/components/features/trip-planning/magic-wand-form";
// Use barrel instead:
import { MagicWandForm } from "@/components/features/trip-planning";

// ❌ DON'T: Mix old and new paths
import { AppHeader } from "@/components/app-header"; // OLD
import { MagicWandForm } from "@/components/features/trip-planning"; // NEW

// ❌ DON'T: Import everything if you only need one
import * as Common from "@/components/common";
Common.AppHeader; // Awkward
// Use direct import instead:
import { AppHeader } from "@/components/common";
```

---

## Import Best Practices

```typescript
// ✓ DO: Use barrel exports
import { AppShell, AppHeader } from "@/components/common";

// ✓ DO: Group imports by source
import { AppShell, AppHeader } from "@/components/common";
import { MagicWandForm, LocationPicker } from "@/components/features/trip-planning";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

// ✓ DO: Use consistent path aliases (@/components, @/lib, @/hooks)
import { HeroSection } from "@/components/features/homepage";
import { useIsMobile } from "@/hooks/use-mobile";
import { t } from "@/lib/i18n";

// ✓ DO: Import types when needed
import type { LocationResult } from "@/lib/location-search";
import type { PopularDestination } from "@/lib/popular-destinations";

// ✓ DO: Separate external libraries
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
```

---

## Type Imports

```typescript
// Import only types using 'type' keyword
import type { LocationResult } from "@/lib/location-search";
import type { PopularDestination } from "@/lib/popular-destinations";

// This helps with tree-shaking and makes intent clear
interface MyComponent {
  location: LocationResult;
  destination: PopularDestination;
}
```

---

## Path Alias Setup

The project uses TypeScript path aliases for clean imports:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["components/*"],
      "@/features/*": ["features/*"],
      "@/lib/*": ["lib/*"],
      "@/hooks/*": ["hooks/*"],
      "@/utils/*": ["utils/*"]
    }
  }
}
```

This is why we use:
- `@/components/...` instead of `../../../components/...`
- `@/lib/...` instead of `../../../lib/...`
- `@/hooks/...` instead of `../../../hooks/...`

---

## Verification Checklist

When updating imports, verify:

- [ ] Correct path alias used (@/ prefix)
- [ ] Component exported in barrel index.ts
- [ ] No typos in import path
- [ ] No missing curly braces for named imports
- [ ] No default import/export mismatch
- [ ] Project builds without errors
- [ ] No console import errors in browser

---

## Quick Reference Table

| Component | Old Path | New Path | Status |
|-----------|----------|----------|--------|
| AppShell | `@/components/app-shell` | `@/components/common` | ✓ Done |
| AppHeader | `@/components/app-header` | `@/components/common` | ✓ Done |
| AutoNomadLogo | `@/components/auto-nomad-logo` | `@/components/common` | ✓ Done |
| MagicWandForm | `@/components/magic-wand-form` | `@/components/features/trip-planning` | ✓ Done |
| LocationPicker | `@/components/location-picker` | `@/components/features/trip-planning` | ✓ Done |
| GenerateTripButton | `@/components/generate-trip-button` | `@/components/features/trip-planning` | ✓ Done |
| HeroSection | `@/components/hero-section` | `@/components/features/homepage` | ✓ Done |
| AuthModal | `@/components/auth-modal` | `@/components/features/auth` | ✓ Done |
| SettingsPanel | `@/components/settings-panel` | `@/components/features/settings` | ✓ Done |
| AgentTerminal | `@/components/agent-terminal` | `@/components/features/agent-terminal` | ⏳ Pending |
| ItineraryDashboard | `@/components/itinerary-dashboard` | `@/components/features/trip-display` | ⏳ Pending |
| TripVault | `@/components/trip-vault` | `@/components/features/trip-vault` | ⏳ Pending |

---

## Need Help?

1. **Finding a component?** Check FOLDER_STRUCTURE.md
2. **Migrating code?** Follow MIGRATION_GUIDE.md
3. **Understanding structure?** Read PROJECT_STRUCTURE.md


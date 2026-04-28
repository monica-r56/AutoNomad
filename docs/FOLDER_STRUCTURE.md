# AutoNomad Project Structure

This document outlines the reorganized project structure following feature-based architecture principles for better maintainability and reusability.

## Directory Organization

```
project/
├── app/                              # Next.js App Router pages
│   ├── layout.tsx                   # Root layout (ThemeProvider, metadata)
│   ├── page.tsx                     # Home page (/)
│   ├── api/                         # API routes
│   │   └── v1/                      # API v1
│   │       ├── agents/              # Agent endpoints
│   │       │   ├── weather/         # Weather analysis agent
│   │       │   ├── places/          # Places discovery agent
│   │       │   └── pricing/         # Pricing agent
│   │       └── generate-trip/       # Main orchestrator
│   ├── browse/                      # Browsing features
│   │   └── destinations/            # Popular destinations
│   │       ├── page.tsx
│   │       └── [slug]/
│   ├── trips/                       # Trip-related pages
│   │   ├── generating/              # Agent terminal page
│   │   └── [tripId]/                # Individual trip itinerary
│   └── vault/                       # User saved trips
│
├── components/                       # React components
│   ├── ui/                          # Shadcn UI components (unchanged)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   └── ... (50+ UI components)
│   │
│   ├── common/                      # Reusable layout components
│   │   ├── app-header.tsx           # Navigation header
│   │   ├── app-shell.tsx            # Root shell with header/footer
│   │   ├── auto-nomad-logo.tsx      # Logo SVG
│   │   └── index.ts                 # Barrel export
│   │
│   └── features/                    # Feature-specific components
│       ├── auth/                    # Authentication
│       │   ├── auth-modal.tsx       # Google OAuth modal
│       │   └── index.ts
│       │
│       ├── settings/                # Settings panel
│       │   ├── settings-panel.tsx
│       │   └── index.ts
│       │
│       ├── trip-planning/           # Trip generation form
│       │   ├── magic-wand-form.tsx  # Main form component
│       │   ├── location-picker.tsx  # Location autocomplete
│       │   ├── generate-trip-button.tsx  # Submit button
│       │   └── index.ts
│       │
│       ├── trip-display/            # Trip viewing components
│       │   ├── itinerary-dashboard.tsx  # Split-pane layout
│       │   ├── itinerary-timeline.tsx   # Timeline view
│       │   ├── activity-card.tsx        # Individual activity
│       │   ├── interactive-map.tsx      # Leaflet map
│       │   ├── action-bar.tsx           # Trip actions
│       │   ├── error-state.tsx
│       │   └── index.ts
│       │
│       ├── trip-vault/              # Saved trips management
│       │   ├── trip-vault.tsx       # Grid of saved trips
│       │   └── index.ts
│       │
│       ├── destinations/            # Popular destinations browsing
│       │   ├── destination-grid.tsx # Grid of all destinations
│       │   ├── destination-detail.tsx  # Individual destination page
│       │   └── index.ts
│       │
│       ├── agent-terminal/          # AI agent visualization
│       │   ├── agent-terminal.tsx   # Terminal UI
│       │   └── index.ts
│       │
│       └── homepage/                # Landing page sections
│           ├── hero-section.tsx     # Hero + form + destinations preview
│           └── index.ts
│
├── lib/                             # Utilities and business logic
│   ├── store.ts                     # Zustand store (state mgmt)
│   ├── i18n.ts                      # Internationalization
│   ├── location-search.ts           # Location API integration
│   ├── route-optimizer.ts           # Route calculation algorithm
│   ├── popular-destinations.ts      # Destination data
│   └── utils.ts                     # Helper functions
│
├── hooks/                           # Custom React hooks
│   ├── use-mobile.ts
│   └── use-toast.ts
│
├── public/                          # Static assets
│   └── images/                      # Generated destination images
│       ├── hero-bg.jpg
│       ├── destination-*.jpg
│       └── ... (5+ destination images)
│
└── docs/                            # Documentation
    ├── README.md
    ├── QUICKSTART.md
    ├── FOLDER_STRUCTURE.md          # This file
    ├── BACKEND_INTEGRATION.md
    ├── PROJECT_STRUCTURE.md
    └── COMPLETION_SUMMARY.md

```

## Component Export Patterns

Each feature folder includes an `index.ts` for barrel exports:

```typescript
// components/features/trip-planning/index.ts
export { MagicWandForm } from "./magic-wand-form";
export { LocationPicker } from "./location-picker";
export { GenerateTripButton } from "./generate-trip-button";
```

Usage: `import { MagicWandForm } from "@/components/features/trip-planning"`

## Import Guidelines

### Do's ✓
```typescript
// Feature imports with barrel export
import { MagicWandForm } from "@/components/features/trip-planning";

// Direct UI imports (shadcn)
import { Button } from "@/components/ui/button";

// Utilities and lib
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
```

### Don'ts ✗
```typescript
// Avoid long relative paths
import { MagicWandForm } from "../../../components/features/trip-planning/magic-wand-form";

// Avoid mixing import styles
import MagicWandForm from "@/components/features/trip-planning/magic-wand-form";
```

## Adding New Features

When adding a new feature:

1. Create folder in `components/features/{feature-name}/`
2. Create components in the folder
3. Create `index.ts` barrel export
4. Import from barrel export in pages
5. Keep feature self-contained

Example: Adding "Reviews" feature

```
components/features/reviews/
├── review-card.tsx
├── reviews-grid.tsx
├── add-review-modal.tsx
└── index.ts
```

## Routing Convention

```
/                          → Home (hero + form)
/browse/destinations       → Browse all destinations
/browse/destinations/{slug} → Single destination detail
/trips/generating          → Agent terminal (in progress)
/trips/{tripId}            → Trip itinerary view
/vault                     → Saved trips (auth required)
/api/v1/*                  → API endpoints
```

## File Naming

- Components: PascalCase (`MagicWandForm.tsx`)
- Utilities: camelCase (`locationSearch.ts`)
- Pages: kebab-case directory, `page.tsx` inside
- Styles: Tailwind only (no separate CSS)

## Migration Notes

### Files moved to new structure:
- `components/app-shell.tsx` → `components/common/app-shell.tsx`
- `components/app-header.tsx` → `components/common/app-header.tsx`
- `components/auto-nomad-logo.tsx` → `components/common/auto-nomad-logo.tsx`
- `components/auth-modal.tsx` → `components/features/auth/auth-modal.tsx`
- `components/settings-panel.tsx` → `components/features/settings/settings-panel.tsx`
- `components/magic-wand-form.tsx` → `components/features/trip-planning/magic-wand-form.tsx`
- `components/location-picker.tsx` → `components/features/trip-planning/location-picker.tsx`
- `components/generate-trip-button.tsx` → `components/features/trip-planning/generate-trip-button.tsx`
- `components/hero-section.tsx` → `components/features/homepage/hero-section.tsx`

### Routing updated:
- `/destinations` → `/browse/destinations`
- `/generating` → `/trips/generating`
- `/itinerary/[tripId]` → `/trips/[tripId]`

## Next Steps

1. Update all remaining component imports throughout the codebase
2. Create barrel export files in each feature folder
3. Update route paths in links and navigation
4. Move legacy components from root `components/` to appropriate folders


# AutoNomad Project Structure

## Directory Hierarchy

```
/vercel/share/v0-project/
├── app/                              # Next.js App Router
│   ├── api/
│   │   └── v1/
│   │       ├── generate-trip/        # Main trip orchestration
│   │       └── agents/
│   │           ├── weather/          # Weather API endpoint
│   │           ├── places/           # Places discovery API
│   │           └── pricing/          # Pricing calculation API
│   ├── destinations/
│   │   ├── page.tsx                  # Browse all destinations
│   │   └── [slug]/
│   │       └── page.tsx              # Individual destination pages
│   ├── generating/
│   │   └── page.tsx                  # Agent terminal (generation in progress)
│   ├── itinerary/
│   │   └── [tripId]/
│   │       └── page.tsx              # View generated itinerary
│   ├── vault/
│   │   └── page.tsx                  # Saved trips gallery
│   ├── layout.tsx                    # Root layout with providers
│   ├── globals.css                   # Tailwind + theme tokens
│   ├── page.tsx                      # Home page (landing)
│   └── favicon.ico
│
├── components/
│   ├── app-header.tsx                # Sticky navigation bar
│   ├── app-shell.tsx                 # Main layout wrapper
│   ├── auth-modal.tsx                # Google OAuth modal
│   ├── settings-panel.tsx            # User preferences panel
│   ├── auto-nomad-logo.tsx          # Custom compass logo SVG
│   ├── hero-section.tsx              # Landing page hero
│   ├── magic-wand-form.tsx          # Trip generation form
│   ├── location-picker.tsx           # Location autocomplete
│   ├── generate-trip-button.tsx     # Animated submit button
│   ├── activity-card.tsx             # Activity display with weather toggle
│   ├── itinerary-timeline.tsx       # Timeline view of activities
│   ├── interactive-map.tsx           # Leaflet map with routing
│   ├── itinerary-dashboard.tsx      # Split-pane dashboard
│   ├── action-bar.tsx                # Download/Book/Split actions
│   ├── agent-terminal.tsx            # Live agent progress UI
│   ├── trip-vault.tsx                # Trip gallery grid
│   ├── error-state.tsx               # Error/empty state
│   └── ui/                           # shadcn/ui components
│       ├── button.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── sheet.tsx
│       ├── tabs.tsx
│       └── ... (other shadcn components)
│
├── lib/
│   ├── store.ts                      # Zustand state management
│   ├── i18n.ts                       # 8-language translations
│   ├── location-search.ts            # OpenStreetMap Nominatim integration
│   ├── route-optimizer.ts            # Nearest-neighbor clustering algorithm
│   ├── popular-destinations.ts       # Pre-curated destination data
│   └── utils.ts                      # Helper functions
│
├── public/
│   └── images/
│       ├── hero-bg.jpg               # Landing page hero background
│       ├── stockholm.jpg             # Sample activity images
│       ├── tokyo.jpg
│       ├── bali.jpg
│       ├── destination-switzerland.jpg
│       ├── destination-sweden.jpg
│       ├── destination-london.jpg
│       ├── destination-new-york.jpg
│       └── destination-tokyo.jpg
│
├── hooks/
│   └── use-mobile.ts                 # Responsive design hook
│
├── BACKEND_INTEGRATION.md            # Backend implementation guide
├── PROJECT_STRUCTURE.md              # This file
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Tailwind CSS v4 config
├── next.config.mjs                   # Next.js configuration
└── .env.local                        # Environment variables (local)
```

## Key Files & Their Purposes

### Frontend Pages

| File | Purpose | Route |
|------|---------|-------|
| `app/page.tsx` | Landing page with trip form | `/` |
| `app/generating/page.tsx` | Agent terminal during generation | `/generating` |
| `app/itinerary/[tripId]/page.tsx` | View itinerary with map & timeline | `/itinerary/[id]` |
| `app/vault/page.tsx` | Saved trips gallery | `/vault` |
| `app/destinations/page.tsx` | Browse all destinations | `/destinations` |
| `app/destinations/[slug]/page.tsx` | Individual destination detail | `/destinations/[slug]` |

### Core Components

| Component | Purpose | Used In |
|-----------|---------|---------|
| `app-header.tsx` | Navigation bar (sticky) | All pages |
| `magic-wand-form.tsx` | Trip generation form | Landing page |
| `location-picker.tsx` | Location autocomplete | Magic wand form |
| `generate-trip-button.tsx` | Animated submit button | Magic wand form |
| `interactive-map.tsx` | Leaflet map with markers | Itinerary, destinations |
| `itinerary-dashboard.tsx` | Split-pane layout | Itinerary page |
| `activity-card.tsx` | Activity display + weather toggle | Timeline, dashboard |
| `agent-terminal.tsx` | Live agent progress animation | Generating page |

### Utilities

| File | Purpose |
|------|---------|
| `lib/store.ts` | Zustand state (auth, trips, preferences) |
| `lib/i18n.ts` | 8 languages + translation helper |
| `lib/location-search.ts` | OpenStreetMap Nominatim API |
| `lib/route-optimizer.ts` | Nearest-neighbor clustering algorithm |
| `lib/popular-destinations.ts` | Pre-curated destination data |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/v1/generate-trip` | POST | Orchestrate 3 agents, return itinerary |
| `/api/v1/agents/places` | POST | Find & cluster tourist attractions |
| `/api/v1/agents/weather` | POST | Check weather, suggest alternatives |
| `/api/v1/agents/pricing` | POST | Calculate trip costs |

## Component Data Flow

```
┌────────────────────────────┐
│  User Interaction          │
│ (Fill form on /)           │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│  magic-wand-form.tsx       │
│ - location-picker (2x)     │
│ - Travel pace selector     │
│ - generate-trip-button     │
└────────────┬───────────────┘
             │
             ▼ (sessionStorage)
┌────────────────────────────┐
│  /generating page          │
│ - agent-terminal.tsx       │
│ - Real-time progress       │
└────────────┬───────────────┘
             │
             ▼ (POST /api/v1/generate-trip)
┌────────────────────────────┐
│  Backend Orchestration      │
│ - LangGraph coordination    │
│ - Agents run in parallel    │
│ - Route optimization        │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│  /itinerary/[tripId] page  │
│ - itinerary-dashboard.tsx  │
│ - Split-pane layout        │
│ - interactive-map.tsx      │
│ - activity-card.tsx        │
│ - action-bar.tsx           │
└────────────────────────────┘
```

## State Management (Zustand)

```typescript
// Global state structure
AppState {
  // Auth
  isAuthenticated: boolean
  user: { name, email, avatar } | null
  showAuthModal: boolean
  
  // Current trip
  currentItinerary: Itinerary | null
  
  // Saved trips
  savedTrips: Itinerary[]
  
  // Agent progress
  agentMessages: AgentMessage[]
  isGenerating: boolean
  
  // User preferences
  preferences: { currency, airport, passport }
  showSettings: boolean
  
  // Localization
  locale: string (default: "en")
  
  // UI state
  splitCost: boolean
}
```

## Styling System

### Theme Tokens (app/globals.css)

```css
/* Light mode */
--background: white
--foreground: rgb(13, 13, 13)
--primary: rgb(37, 99, 235)
--primary-foreground: white
--secondary: rgb(226, 232, 240)
--muted: rgb(241, 245, 249)
--muted-foreground: rgb(100, 116, 139)

/* Dark mode (via next-themes) */
--background: rgb(13, 13, 13)
--foreground: rgb(241, 245, 249)
/* ... inverted colors ... */
```

### Color Palette

| Color | Usage |
|-------|-------|
| Primary (Blue) | Buttons, links, highlights |
| Secondary (Slate) | Accents, status badges |
| Muted (Gray) | Backgrounds, disabled states |
| Destructive (Red) | Errors, delete actions |
| Success (Green) | Confirmations, availability |

## Responsive Design

- **Mobile-first** approach
- **Breakpoints:** sm (640px), md (768px), lg (1024px)
- **Split-pane** on desktop, **tabs** on mobile
- **Sticky header** with responsive nav items
- **Touch-friendly** tap targets (min 44px)

## Performance Optimizations

1. **Image Optimization**
   - Next.js Image component for lazy loading
   - JPEG format for photos
   - Responsive srcset

2. **Code Splitting**
   - Dynamic imports for heavy components (Leaflet)
   - Route-based code splitting

3. **State Management**
   - Zustand for minimal bundle
   - Memoization in components
   - SWR for API data fetching

4. **Bundle Size**
   - Leaflet loaded dynamically
   - Tailwind CSS v4 (smaller output)
   - Tree-shakeable shadcn/ui

## Environment Variables

```bash
# Backend APIs (required for production)
PLACES_API_KEY=          # Google Places or OpenTripMap
WEATHER_API_KEY=         # OpenWeatherMap
SKYSCANNER_API_KEY=      # Flight prices
BOOKING_API_KEY=         # Hotel prices
CURRENCY_API_KEY=        # Currency conversion

# Optional
NEXT_PUBLIC_GA_ID=       # Google Analytics
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Accessibility

- Semantic HTML (`<main>`, `<header>`, `<nav>`)
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader optimizations
- High contrast mode support
- Focus indicators on all buttons

## Internationalization

Supported languages (in `lib/i18n.ts`):
- English (en) - Default
- Deutsch (de)
- Français (fr)
- Italiano (it)
- Svenska (sv)
- Norsk (no)
- Suomi (fi)
- Español (es)

## Development Workflow

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Testing Strategy

- Unit tests for utilities (route optimizer, location search)
- Integration tests for API endpoints
- E2E tests for main user flows
- Component snapshot tests with Vitest

---

For detailed backend integration instructions, see `BACKEND_INTEGRATION.md`.

# AutoNomad QuickStart Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# 1. Clone/download the project
cd /vercel/share/v0-project

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local  # (Currently using mocks, so optional)

# 4. Start development server
pnpm dev

# 5. Open browser
# Visit http://localhost:3000
```

## 📋 Feature Overview

### ✅ Fully Implemented (Frontend)

| Feature | Status | File |
|---------|--------|------|
| Landing page with form | ✅ Complete | `app/page.tsx` |
| Location picker (cities/airports) | ✅ Complete | `components/location-picker.tsx` |
| Trip form with validation | ✅ Complete | `components/magic-wand-form.tsx` |
| Travel pace selector (side-by-side) | ✅ Complete | `components/magic-wand-form.tsx` |
| Animated generate button | ✅ Complete | `components/generate-trip-button.tsx` |
| Agent terminal/progress page | ✅ Complete | `app/generating/page.tsx` |
| Interactive Leaflet map | ✅ Complete | `components/interactive-map.tsx` |
| Itinerary split-pane dashboard | ✅ Complete | `app/itinerary/[tripId]/page.tsx` |
| Activity cards with badges | ✅ Complete | `components/activity-card.tsx` |
| Weather toggle (Plan B) | ✅ Complete | `components/activity-card.tsx` |
| Split cost calculator | ✅ Complete | `components/action-bar.tsx` |
| Trip vault (saved trips) | ✅ Complete | `app/vault/page.tsx` |
| Popular destinations pages | ✅ Complete | `app/destinations/*` |
| Multi-language support (8 langs) | ✅ Complete | `lib/i18n.ts` |
| Dark/light theme toggle | ✅ Complete | `components/app-header.tsx` |
| Settings panel | ✅ Complete | `components/settings-panel.tsx` |
| Route optimizer algorithm | ✅ Complete | `lib/route-optimizer.ts` |
| Location search API | ✅ Complete | `lib/location-search.ts` |

### 🔄 Backend Placeholders (TODO - Your Implementation)

| Feature | File | Next Steps |
|---------|------|-----------|
| Places Agent | `app/api/v1/agents/places/route.ts` | Connect Google Places / OpenTripMap API |
| Weather Agent | `app/api/v1/agents/weather/route.ts` | Connect OpenWeatherMap API |
| Pricing Agent | `app/api/v1/agents/pricing/route.ts` | Connect Skyscanner/Booking APIs |
| LangGraph Orchestration | `app/api/v1/generate-trip/route.ts` | Implement LangGraph workflow |

## 🎯 Common Tasks

### Adding a New Destination

```typescript
// Edit lib/popular-destinations.ts
export const POPULAR_DESTINATIONS: PopularDestination[] = [
  {
    id: "dest-6",
    name: "Your City",
    country: "Country",
    slug: "your-city",
    description: "...",
    image: "/images/destination-your-city.jpg",
    highlights: [...],
    // ... rest of fields
  }
];
```

### Changing Color Theme

```css
/* app/globals.css */
@theme inline {
  /* Update these CSS variables */
  --primary: rgb(your-color);
  --secondary: rgb(your-color);
  /* etc. */
}
```

### Adding a New Language

```typescript
// lib/i18n.ts
export const messages: Record<LocaleCode, Messages> = {
  "pt": {  // Portuguese
    "nav.signIn": "Entrar",
    "nav.vault": "Cofre de Viagens",
    // ... translate all keys
  }
};

// Update LOCALES
export const LOCALES = [
  // ... existing
  { code: "pt", label: "Português", flag: "PT" },
];
```

### Testing Location Search

```typescript
// Open browser console and test
import { searchLocations } from "@/lib/location-search";

const results = await searchLocations("Delhi");
console.log(results); // Array of LocationResult
```

### Testing Route Optimizer

```typescript
// lib/route-optimizer.ts usage
import { optimizeRoute } from "@/lib/route-optimizer";

const route = optimizeRoute(
  activities,  // Array of Activity
  5,           // Days available
  { lat: 59.33, lng: 18.07 }  // Starting location
);
console.log(route.clusters);  // Daily clusters
```

## 🔌 Backend Integration Checklist

When you're ready to add real APIs:

1. **Places Agent** (`app/api/v1/agents/places/route.ts`)
   - [ ] Get Google Places API key (or use free OpenTripMap)
   - [ ] Implement `searchNearbyPlaces()` function
   - [ ] Implement `clusterPlacesByProximity()` function
   - [ ] Implement `suggestIndoorAlternatives()` function
   - [ ] Test with sample destination coordinates

2. **Weather Agent** (`app/api/v1/agents/weather/route.ts`)
   - [ ] Get OpenWeatherMap API key
   - [ ] Implement `fetchWeatherData()` function
   - [ ] Implement `evaluateOutdoorSuitability()` function
   - [ ] Test weather toggle on activity cards

3. **Pricing Agent** (`app/api/v1/agents/pricing/route.ts`)
   - [ ] Get Skyscanner API key (or alternative flight API)
   - [ ] Get Booking.com API key (or alternative hotel API)
   - [ ] Implement `searchFlights()` function
   - [ ] Implement `searchHotels()` function
   - [ ] Implement `priceActivities()` function
   - [ ] Implement `optimizeBudget()` function

4. **LangGraph Orchestration** (`app/api/v1/generate-trip/route.ts`)
   - [ ] Install LangGraph and @anthropic-sdk
   - [ ] Replace mock `generateMockItinerary()` with real LangGraph workflow
   - [ ] Test full trip generation with all agents

5. **Database** (Optional but recommended)
   - [ ] Set up Supabase or Neon PostgreSQL
   - [ ] Create trips table
   - [ ] Create users table
   - [ ] Implement auth integration

## 🐛 Debugging Tips

### Check agent responses in browser

```typescript
// Open DevTools Console and manually test endpoints
const response = await fetch("/api/v1/agents/weather", {
  method: "POST",
  body: JSON.stringify({
    location: { lat: 59.33, lng: 18.07 },
    date: "2026-06-15",
    activityType: "outdoor"
  })
});
const data = await response.json();
console.log(data);
```

### Map not showing

- Check if Leaflet CDN is loading
- Verify activities have valid lat/lng
- Check browser console for errors
- Ensure InteractiveMap parent has height defined

### Location picker not working

- Check OpenStreetMap Nominatim is accessible
- Verify location query is ≥2 characters
- Check for CORS issues in console
- Try different city names (e.g., "Paris" vs "Paris, France")

### Form validation failing

- Check all required fields are filled
- Ensure departure date is in future
- Verify numbers are within valid ranges
- Clear localStorage if stuck: `localStorage.clear()`

## 📱 Responsive Design Testing

```bash
# Use Chrome DevTools
# Ctrl+Shift+M (Windows) or Cmd+Shift+M (Mac) for device mode

# Test breakpoints:
# - Mobile: 375px (iPhone SE)
# - Tablet: 768px (iPad)
# - Desktop: 1024px+ (full width)
```

## 🌐 Browser Testing

```bash
# Test in all major browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest on macOS/iOS)
- Edge (latest)

# Dark mode testing (system preference)
# - Windows: Settings > Colors > Dark
# - macOS: System Prefs > Appearance > Dark
# - iOS: Settings > Display & Brightness > Dark
```

## 📊 Performance Profiling

```bash
# Lighthouse audit (Chrome DevTools > Lighthouse)
# Target scores:
# - Performance: 90+
# - Accessibility: 95+
# - Best Practices: 90+
# - SEO: 90+

# Bundle analysis
pnpm build
# Check .next/static/chunks for large files
```

## 🚢 Deployment (Vercel)

```bash
# 1. Connect GitHub repo to Vercel
# 2. Set environment variables in Vercel dashboard
# 3. Deploy
git push origin main  # Auto-deploys on Vercel

# Custom domain
# Settings > Domains > Add custom domain
```

## 📚 Additional Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Zustand:** https://github.com/pmndrs/zustand
- **Leaflet:** https://leafletjs.com/reference.html
- **LangGraph:** https://langchain-ai.github.io/langgraph
- **OpenStreetMap:** https://nominatim.org/

## 🤝 Need Help?

1. **Check the docs:**
   - `BACKEND_INTEGRATION.md` - Backend setup guide
   - `PROJECT_STRUCTURE.md` - Codebase organization

2. **Look at example implementations:**
   - Search for `// TODO:` comments in code
   - Mock data shows expected response formats

3. **Test with console logs:**
   ```typescript
   console.log("[v0] Debug message:", variable);
   ```

## ✨ Pro Tips

1. **Location picker** - Works best with city names, not full addresses
2. **Interactive map** - Hover over markers to see details
3. **Itinerary dashboard** - Split-pane on desktop, tabs on mobile
4. **Theme toggle** - Syncs across all components via next-themes
5. **Travel pace** - Affects activity recommendations (fast = more activities, slow = deeper experiences)

---

Happy coding! 🎉

For questions or issues, check the backend integration guide or reach out to the team.

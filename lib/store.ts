import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────────
export type Badge = "hidden-gem" | "cheapest" | "fastest" | "top-rated";

export interface Activity {
  id: string;
  type: "flight" | "hotel" | "activity" | "transport" | "food";
  title: string;
  description: string;
  time: string;
  duration: string;
  cost: number;
  currency: string;
  image: string;
  sourceUrl?: string;
  badges: Badge[];
  isOutdoor: boolean;
  indoorAlternative?: {
    title: string;
    description: string;
    cost: number;
  };
  location: { lat: number; lng: number };
}

export interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
  expertTip?: string;
}

export interface Itinerary {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  duration: number;
  travelers: number;
  budget: number;
  currency: string;
  pace: "fast" | "slow";
  days: DayPlan[];
  totalCost: number;
  budgetViability: "feasible" | "tight" | "exceeds";
  createdAt: string;
  status: "draft" | "saved" | "booked";
}

export interface UserPreferences {
  defaultCurrency: string;
  homeAirport: string;
  passportCountry: string;
}

export interface AgentMessage {
  agent: string;
  message: string;
  status: "pending" | "active" | "done";
}

// ── Store ──────────────────────────────────────────────────────
interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: { name: string; email: string; avatar: string } | null;
  showAuthModal: boolean;
  authRedirectPath: string | null;
  setAuthenticated: (val: boolean) => void;
  setUser: (user: AppState["user"]) => void;
  setShowAuthModal: (val: boolean, redirectPath?: string | null) => void;

  // Current itinerary
  currentItinerary: Itinerary | null;
  setCurrentItinerary: (itinerary: Itinerary | null) => void;

  // Trip vault
  savedTrips: Itinerary[];
  addTrip: (trip: Itinerary) => void;

  // Agent terminal
  agentMessages: AgentMessage[];
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  addAgentMessage: (msg: AgentMessage) => void;
  clearAgentMessages: () => void;

  // Preferences
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;

  // Locale
  locale: string;
  setLocale: (locale: string) => void;

  // Split cost toggle
  splitCost: boolean;
  setSplitCost: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  isAuthenticated: false,
  user: null,
  showAuthModal: false,
  authRedirectPath: null,
  setAuthenticated: (val) => set({ isAuthenticated: val }),
  setUser: (user) => set({ user }),
  setShowAuthModal: (val, redirectPath = null) =>
    set({ showAuthModal: val, authRedirectPath: redirectPath }),

  // Itinerary
  currentItinerary: null,
  setCurrentItinerary: (itinerary) => set({ currentItinerary: itinerary }),

  // Vault
  savedTrips: [],
  addTrip: (trip) =>
    set((state) => ({ savedTrips: [...state.savedTrips, trip] })),

  // Agent
  agentMessages: [],
  isGenerating: false,
  setIsGenerating: (val) => set({ isGenerating: val }),
  addAgentMessage: (msg) =>
    set((state) => ({ agentMessages: [...state.agentMessages, msg] })),
  clearAgentMessages: () => set({ agentMessages: [] }),

  // Preferences
  preferences: {
    defaultCurrency: "USD",
    homeAirport: "",
    passportCountry: "",
  },
  setPreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),
  showSettings: false,
  setShowSettings: (val) => set({ showSettings: val }),

  // Locale
  locale: "en",
  setLocale: (locale) => set({ locale }),

  // Split cost
  splitCost: false,
  setSplitCost: (val) => set({ splitCost: val }),
}));

// ── Mock API function ──────────────────────────────────────────
export async function generateTrip(params: {
  origin: string;
  destination: string;
  departureDate: string;
  duration: number;
  travelers: number;
  budget: number;
  currency: string;
  pace: "fast" | "slow";
}): Promise<Itinerary> {
  try {
    const response = await fetch("/api/v1/generate-trip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || "Failed to generate trip");
    }

    return await response.json();
  } catch (error) {
    console.error("[Store] Trip generation failed:", error);
    throw error;
  }
}



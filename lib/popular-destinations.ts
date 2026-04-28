/**
 * Popular Destinations Data
 * Pre-curated itineraries for quick access and inspiration
 * Can be made interactive to add/remove destinations
 */

export interface PopularDestination {
  id: string;
  name: string;
  country: string;
  slug: string;
  description: string;
  image: string;
  highlights: string[];
  bestTime: string;
  estimatedDays: number;
  estimatedBudget: {
    min: number;
    max: number;
    currency: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  attractions: Array<{
    name: string;
    type: string;
    description: string;
    estimatedTime: string;
    cost: number;
    isOutdoor: boolean;
  }>;
}

export const POPULAR_DESTINATIONS: PopularDestination[] = [
  {
    id: "dest-1",
    name: "Switzerland",
    country: "Switzerland",
    slug: "switzerland",
    description:
      "Alpine adventures, pristine lakes, and world-class chocolate await in the heart of Europe.",
    image: "/images/destination-switzerland.jpg",
    highlights: [
      "Swiss Alps hiking",
      "Jungfrau Railway",
      "Lake Lucerne",
      "Interlaken adventures",
      "Zurich culture",
    ],
    bestTime: "June to September",
    estimatedDays: 6,
    estimatedBudget: {
      min: 2000,
      max: 4500,
      currency: "CHF",
    },
    coordinates: {
      lat: 46.8182,
      lng: 8.2275,
    },
    attractions: [
      {
        name: "Jungfrau Peak",
        type: "mountain",
        description: "Top of Europe - stunning alpine views",
        estimatedTime: "Full day",
        cost: 180,
        isOutdoor: true,
      },
      {
        name: "Lake Lucerne",
        type: "lake",
        description: "Scenic boat rides through alpine lake",
        estimatedTime: "3 hours",
        cost: 45,
        isOutdoor: true,
      },
      {
        name: "Swiss Museum",
        type: "museum",
        description: "Cultural heritage and history",
        estimatedTime: "2 hours",
        cost: 25,
        isOutdoor: false,
      },
    ],
  },
  {
    id: "dest-2",
    name: "Sweden",
    country: "Sweden",
    slug: "sweden",
    description:
      "Northern lights, endless forests, and Scandinavian design in Stockholm and beyond.",
    image: "/images/destination-sweden.jpg",
    highlights: [
      "Stockholm Archipelago",
      "Aurora Borealis",
      "Swedish Meatballs",
      "Gamla Stan Old Town",
      "Swedish Nature",
    ],
    bestTime: "September to March (Aurora), June to August (Summer)",
    estimatedDays: 5,
    estimatedBudget: {
      min: 1500,
      max: 3500,
      currency: "SEK",
    },
    coordinates: {
      lat: 59.3293,
      lng: 18.0686,
    },
    attractions: [
      {
        name: "Gamla Stan",
        type: "historic-site",
        description: "Medieval old town with cobblestone streets",
        estimatedTime: "2 hours",
        cost: 0,
        isOutdoor: true,
      },
      {
        name: "Vasa Museum",
        type: "museum",
        description: "17th-century warship with interactive exhibits",
        estimatedTime: "2 hours",
        cost: 150,
        isOutdoor: false,
      },
      {
        name: "Stockholm Archipelago Cruise",
        type: "water-activity",
        description: "Scenic boat tour through 30,000 islands",
        estimatedTime: "4 hours",
        cost: 65,
        isOutdoor: true,
      },
    ],
  },
  {
    id: "dest-3",
    name: "London",
    country: "United Kingdom",
    slug: "london",
    description:
      "Historic landmarks, world-class museums, and vibrant culture in a city of endless exploration.",
    image: "/images/destination-london.jpg",
    highlights: [
      "Big Ben & Parliament",
      "Tower of London",
      "British Museum",
      "West End Theater",
      "Royal Parks",
    ],
    bestTime: "May to September",
    estimatedDays: 4,
    estimatedBudget: {
      min: 1800,
      max: 3800,
      currency: "GBP",
    },
    coordinates: {
      lat: 51.5074,
      lng: -0.1278,
    },
    attractions: [
      {
        name: "Big Ben & Houses of Parliament",
        type: "landmark",
        description: "Iconic Gothic Revival architecture",
        estimatedTime: "1.5 hours",
        cost: 0,
        isOutdoor: true,
      },
      {
        name: "British Museum",
        type: "museum",
        description: "World history and artifacts",
        estimatedTime: "3 hours",
        cost: 0,
        isOutdoor: false,
      },
      {
        name: "West End Theatre",
        type: "entertainment",
        description: "World-class musical productions",
        estimatedTime: "3 hours",
        cost: 60,
        isOutdoor: false,
      },
    ],
  },
  {
    id: "dest-4",
    name: "New York",
    country: "United States",
    slug: "new-york",
    description:
      "The city that never sleeps - skyscrapers, Broadway, and endless urban energy.",
    image: "/images/destination-new-york.jpg",
    highlights: [
      "Times Square",
      "Central Park",
      "Empire State Building",
      "Broadway Shows",
      "Brooklyn Bridge",
    ],
    bestTime: "April to May, September to October",
    estimatedDays: 5,
    estimatedBudget: {
      min: 2500,
      max: 5000,
      currency: "USD",
    },
    coordinates: {
      lat: 40.7128,
      lng: -74.006,
    },
    attractions: [
      {
        name: "Central Park",
        type: "park",
        description: "Urban oasis with scenic walking paths",
        estimatedTime: "3 hours",
        cost: 0,
        isOutdoor: true,
      },
      {
        name: "Empire State Building",
        type: "landmark",
        description: "Iconic skyscraper with observation decks",
        estimatedTime: "2 hours",
        cost: 45,
        isOutdoor: false,
      },
      {
        name: "Broadway Show",
        type: "entertainment",
        description: "World-famous theatrical productions",
        estimatedTime: "3 hours",
        cost: 75,
        isOutdoor: false,
      },
    ],
  },
  {
    id: "dest-5",
    name: "Tokyo",
    country: "Japan",
    slug: "tokyo",
    description:
      "Ancient temples meet cutting-edge technology in the electric capital of Japan.",
    image: "/images/destination-tokyo.jpg",
    highlights: [
      "Senso-ji Temple",
      "Shibuya Crossing",
      "Mount Fuji views",
      "Japanese Cuisine",
      "Ryoten Hot Springs",
    ],
    bestTime: "March to May, September to November",
    estimatedDays: 5,
    estimatedBudget: {
      min: 1800,
      max: 3500,
      currency: "JPY",
    },
    coordinates: {
      lat: 35.6762,
      lng: 139.6503,
    },
    attractions: [
      {
        name: "Senso-ji Temple",
        type: "temple",
        description: "Ancient Buddhist temple in Asakusa",
        estimatedTime: "1.5 hours",
        cost: 0,
        isOutdoor: true,
      },
      {
        name: "Shibuya Crossing",
        type: "landmark",
        description: "World's busiest pedestrian crossing",
        estimatedTime: "30 minutes",
        cost: 0,
        isOutdoor: true,
      },
      {
        name: "Traditional Tea Ceremony",
        type: "cultural-experience",
        description: "Learn Japanese tea tradition",
        estimatedTime: "1.5 hours",
        cost: 55,
        isOutdoor: false,
      },
    ],
  },
];

export function getDestinationBySlug(slug: string): PopularDestination | undefined {
  return POPULAR_DESTINATIONS.find((d) => d.slug === slug);
}

export function getAllDestinations(): PopularDestination[] {
  return POPULAR_DESTINATIONS;
}

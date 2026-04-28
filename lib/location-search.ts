/**
 * Location Search Utility
 * Uses OpenStreetMap Nominatim API for geolocation search
 * No API key required - free & open source
 */

export interface LocationResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  country: string;
  city?: string;
  iataCode?: string;
}

const NOMINATIM_API = "https://nominatim.openstreetmap.org";
const GOOGLE_PLACES_API_KEY = process.env.PLACES_API_KEY;
const GOOGLE_PLACES_BASE = "https://places.googleapis.com/v1/places:searchText";

const AMADEUS_BASE = process.env.AMADEUS_BASE?.replace(/\/+$/, "") ?? "https://test.api.amadeus.com";
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

let amadeusToken: { value: string; expiresAt: number } | null = null;

async function getAmadeusToken() {
  const now = Date.now();
  if (amadeusToken && amadeusToken.expiresAt > now) {
    return amadeusToken.value;
  }
  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    return null;
  }

  try {
    const response = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    amadeusToken = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000) - 30000,
    };
    return amadeusToken.value;
  } catch (error) {
    console.error("Failed to get Amadeus token:", error);
    return null;
  }
}

async function searchWithAmadeus(query: string): Promise<LocationResult[]> {
  const token = await getAmadeusToken();
  if (!token) return [];

  try {
    const url = new URL(`${AMADEUS_BASE}/v1/reference-data/locations`);
    url.searchParams.set("keyword", query);
    url.searchParams.set("subType", "AIRPORT,CITY");
    url.searchParams.set("page[limit]", "5");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      displayName: `${item.name}${item.iataCode ? ` (${item.iataCode})` : ""}, ${item.address.cityName}, ${item.address.countryName}`,
      lat: item.geoCode.latitude,
      lng: item.geoCode.longitude,
      type: item.subType.toLowerCase(),
      country: item.address.countryName,
      city: item.address.cityName,
      iataCode: item.iataCode,
    }));
  } catch (error) {
    console.error("Amadeus location search failed:", error);
    return [];
  }
}

/**
 * Search for locations using Google Places API (New) with Amadeus and Nominatim fallbacks
 */
export async function searchLocations(query: string): Promise<LocationResult[]> {
  if (!query || query.trim().length < 2) return [];

  const trimmedQuery = query.trim();
  const isPotentialIATA = trimmedQuery.length === 3 && /^[A-Z]{3}$/i.test(trimmedQuery);

  try {
    // Fetch from both in parallel for better speed and variety
    const [amadeusResults, googleResults] = await Promise.all([
      searchWithAmadeus(trimmedQuery).catch(err => {
        console.warn("[Location Search] Amadeus failed:", err.message);
        return [] as LocationResult[];
      }),
      GOOGLE_PLACES_API_KEY 
        ? searchWithGoogle(trimmedQuery).catch(err => {
            console.warn("[Location Search] Google failed:", err.message);
            return [] as LocationResult[];
          })
        : Promise.resolve([] as LocationResult[])
    ]);

    // Merge results, prioritizing Amadeus for IATA codes
    const combined: LocationResult[] = [...amadeusResults];
    
    // Add Google results that aren't already represented by Amadeus
    for (const g of googleResults) {
      const isDuplicate = combined.some(a => {
        // Match if IATA codes are the same
        if (a.iataCode && g.iataCode && a.iataCode === g.iataCode) return true;

        const nameA = a.name.toLowerCase().replace(/ airport| intl| international/g, "");
        const nameG = g.name.toLowerCase().replace(/ airport| intl| international/g, "");
        
        // Match if names are very similar OR coordinates are very close
        const namesMatch = nameA.includes(nameG) || nameG.includes(nameA);
        const coordsMatch = Math.abs(a.lat - g.lat) < 0.02 && Math.abs(a.lng - g.lng) < 0.02;
        
        return namesMatch && coordsMatch;
      });
      
      if (!isDuplicate) {
        combined.push(g);
      }
    }

    // Sort by "relevance"
    combined.sort((a, b) => {
      // 1. Exact IATA match
      if (isPotentialIATA) {
        if (a.iataCode?.toLowerCase() === trimmedQuery.toLowerCase()) return -1;
        if (b.iataCode?.toLowerCase() === trimmedQuery.toLowerCase()) return 1;
      }
      
      // 2. Prioritize results with IATA codes (usually more relevant for travel)
      if (a.iataCode && !b.iataCode) return -1;
      if (!a.iataCode && b.iataCode) return 1;
      
      // 3. Exact name match
      if (a.name.toLowerCase() === trimmedQuery.toLowerCase()) return -1;
      if (b.name.toLowerCase() === trimmedQuery.toLowerCase()) return 1;

      return 0;
    });

    if (combined.length > 0) {
      return combined.slice(0, 8);
    }
  } catch (error) {
    console.error("[Location Search] Combined search failed:", error);
  }

  // Last fallback to Nominatim
  return searchWithNominatim(trimmedQuery);
}

async function searchWithGoogle(query: string): Promise<LocationResult[]> {
  const response = await fetch(GOOGLE_PLACES_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY!,
      "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress,places.types,places.addressComponents",
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 8,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = await response.json();
  const places = data.places || [];

  return places.map((p: any) => {
    const addressComponents = p.addressComponents || [];
    const country = addressComponents.find((c: any) => c.types.includes("country"))?.longText || "";
    const city = addressComponents.find((c: any) => 
      c.types.includes("locality") || 
      c.types.includes("administrative_area_level_1") ||
      c.types.includes("postal_town")
    )?.longText;

    // Create a cleaner display name if possible
    let displayName = p.formattedAddress || p.displayName?.text || "";
    
    // If it's a long address, try to shorten it to "City, Country" or "Place Name, City"
    if (city && country && city !== p.displayName?.text) {
      displayName = `${p.displayName?.text}, ${city}, ${country}`;
    } else if (city && city !== p.displayName?.text) {
      displayName = `${p.displayName?.text}, ${city}`;
    } else if (country && country !== p.displayName?.text) {
      displayName = `${p.displayName?.text}, ${country}`;
    }

    return {
      id: p.id,
      name: p.displayName?.text || query,
      displayName: displayName,
      lat: p.location.latitude,
      lng: p.location.longitude,
      type: p.types?.[0] || "locality",
      country,
      city,
    };
  });
}

async function searchWithNominatim(query: string): Promise<LocationResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "8",
      featuretype: "city,airport",
      countrycodes: "", // Search globally
      "accept-language": "en",
      addressdetails: "1",
    });

    const response = await fetch(
      `${NOMINATIM_API}/search.php?${params.toString()}`,
      {
        headers: {
          "User-Agent": "AutoNomad-TravelApp/1.0",
        },
      }
    );

    if (!response.ok) throw new Error("Nominatim search failed");

    const results = await response.json() as Array<{
      osm_id: number;
      display_name: string;
      lat: string;
      lon: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        country?: string;
      };
    }>;

    return results.map((r) => ({
      id: String(r.osm_id),
      name: extractCityName(r.display_name),
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      type: "city",
      country: r.address?.country || "",
      city: r.address?.city || r.address?.town || r.address?.village,
    }));
  } catch (error) {
    console.error("[Location Search] Nominatim error:", error);
    return [];
  }
}

/**
 * Extract city name from full display name
 * e.g., "Stockholm, Sweden" => "Stockholm"
 */
function extractCityName(displayName: string): string {
  const parts = displayName.split(",").map((p) => p.trim());
  return parts[0] || displayName;
}

/**
 * Reverse geocode to get location from coordinates
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<LocationResult | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_API}/reverse.php?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": "AutoNomad-TravelApp/1.0",
        },
      }
    );

    if (!response.ok) throw new Error("Reverse geocode failed");

    const data = await response.json() as {
      osm_id: number;
      display_name: string;
      address?: {
        city?: string;
        country?: string;
      };
    };

    return {
      id: String(data.osm_id),
      name: extractCityName(data.display_name),
      displayName: data.display_name,
      lat,
      lng,
      type: "city",
      country: data.address?.country || "",
      city: data.address?.city || undefined,
    };
  } catch (error) {
    console.error("[v0] Reverse geocode error:", error);
    return null;
  }
}

/**
 * Get airport code from location name
 * Returns IATA code if available
 */
export function extractAirportCode(locationName: string): string {
  // Simple regex to extract 3-letter code
  const match = locationName.match(/\b([A-Z]{3})\b/);
  return match ? match[1] : locationName.substring(0, 3).toUpperCase();
}

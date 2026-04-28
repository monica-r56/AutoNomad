import { searchLocations } from "@/lib/location-search";

export interface ResolvedLocation {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  country?: string;
}

export async function resolveLocation(name: string): Promise<ResolvedLocation> {
  if (!name || !name.trim()) {
    throw new Error("Destination name is required to resolve coordinates.");
  }

  const results = await searchLocations(name);
  if (!results.length) {
    throw new Error(`Unable to resolve location: ${name}`);
  }

  const top = results[0];
  return {
    name: top.name,
    displayName: top.displayName,
    lat: top.lat,
    lng: top.lng,
    country: top.country,
  };
}

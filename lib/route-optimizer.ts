/**
 * Route Optimizer - Efficient Trip Planning Algorithm
 * Uses nearest-neighbor clustering with time-window constraints
 *
 * Features:
 * - Clusters activities by geographic proximity (within city)
 * - Respects activity time windows (e.g., waterfalls only 9am-5pm)
 * - Minimizes travel time between activities
 * - Groups round-trip activities (visit -> return to starting point)
 */

export interface Location {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  title: string;
  location: Location;
  minTime?: string; // e.g., "09:00"
  maxTime?: string; // e.g., "17:00"
  estimatedDuration?: number; // minutes
  isOutdoor?: boolean;
  groupId?: string; // For round-trip grouping
}

export interface OptimizedRoute {
  sequenceOrder: string[]; // Activity IDs in optimal order
  clusters: ActivityCluster[];
  estimatedTravelTime: number; // minutes
  warnings: string[];
}

export interface ActivityCluster {
  day: number;
  activities: string[]; // Activity IDs
  locationBounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  estimatedTravelTime: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  loc1: Location,
  loc2: Location
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate travel time in minutes (heuristic: ~60km per hour)
 */
function estimateTravelTime(distanceKm: number): number {
  return Math.ceil((distanceKm / 60) * 60); // km / speed(km/h) * 60
}

/**
 * Check if activity time window is valid
 */
function isActivityWithinTimeWindow(
  activity: Activity,
  currentTime: number
): boolean {
  if (!activity.minTime || !activity.maxTime) return true;

  const [minHour, minMin] = activity.minTime.split(":").map(Number);
  const [maxHour, maxMin] = activity.maxTime.split(":").map(Number);
  const minMinutes = minHour * 60 + minMin;
  const maxMinutes = maxHour * 60 + maxMin;

  return currentTime >= minMinutes && currentTime <= maxMinutes;
}

/**
 * Main routing optimization function
 * Groups activities into daily clusters using nearest-neighbor algorithm
 */
export function optimizeRoute(
  activities: Activity[],
  daysAvailable: number,
  startingLocation: Location
): OptimizedRoute {
  if (activities.length === 0) {
    return {
      sequenceOrder: [],
      clusters: [],
      estimatedTravelTime: 0,
      warnings: [],
    };
  }

  const warnings: string[] = [];
  const sortedActivities = [...activities];
  const clusters: ActivityCluster[] = [];
  const sequenceOrder: string[] = [];
  const unvisited = new Set(sortedActivities.map((a) => a.id));
  let currentLocation = startingLocation;
  let currentTime = 9 * 60; // Start at 9 AM in minutes
  let totalTravelTime = 0;
  let currentDayActivities: string[] = [];
  let currentDay = 1;

  // Nearest-neighbor clustering algorithm
  while (unvisited.size > 0 && currentDay <= daysAvailable) {
    let nearestActivity: Activity | null = null;
    let nearestDistance = Infinity;

    // Find nearest unvisited activity from current location
    let bestCandidate: { id: string, distance: number, activity: Activity } | null = null;

    for (const id of unvisited) {
      const activity = sortedActivities.find((a) => a.id === id);
      if (!activity) continue;

      const distance = calculateDistance(currentLocation, activity.location);
      
      // Heuristic: Prefer activities with time restrictions if we are early
      let priorityScore = distance;
      if (activity.minTime && currentTime < 12 * 60) {
        priorityScore *= 0.8; // Boost priority for places that might close early
      }

      if (!bestCandidate || priorityScore < bestCandidate.distance) {
        bestCandidate = { id, distance, activity };
      }
    }

    if (!bestCandidate) break;
    nearestActivity = bestCandidate.activity;
    nearestDistance = bestCandidate.distance;

    // Check time window constraint
    const travelTime = estimateTravelTime(nearestDistance);
    const newActivityTime = currentTime + travelTime;

    if (!isActivityWithinTimeWindow(nearestActivity, newActivityTime)) {
      warnings.push(
        `⏰ ${nearestActivity.title} has time restrictions and may not be optimal for this time`
      );
    }

    // Add to current day
    sequenceOrder.push(nearestActivity.id);
    currentDayActivities.push(nearestActivity.id);
    unvisited.delete(nearestActivity.id);
    currentLocation = nearestActivity.location;
    currentTime = newActivityTime + (nearestActivity.estimatedDuration || 120);
    totalTravelTime += travelTime;

    // Check if day is full (7-9 hours of activities + travel depending on pace)
    if (currentTime > 18 * 60 || currentDayActivities.length >= 6) {
      // Save cluster
      const clusterObjs = currentDayActivities.map((id) => 
        sortedActivities.find((a) => a.id === id)!
      );
      const bounds = calculateBounds(clusterObjs);

      clusters.push({
        day: currentDay,
        activities: currentDayActivities,
        locationBounds: bounds,
        estimatedTravelTime: totalTravelTime,
      });

      // Reset for next day
      currentDayActivities = [];
      currentDay++;
      currentTime = 9 * 60;
      totalTravelTime = 0; // Reset travel time for the new day
      currentLocation = startingLocation; // Start each day from the base location
    }
  }

  // Add remaining activities to final cluster
  if (currentDayActivities.length > 0 && currentDay <= daysAvailable) {
    const clusterObjs = currentDayActivities.map((id) => 
      sortedActivities.find((a) => a.id === id)!
    );
    const bounds = calculateBounds(clusterObjs);

    clusters.push({
      day: currentDay,
      activities: currentDayActivities,
      locationBounds: bounds,
      estimatedTravelTime: totalTravelTime,
    });
  }

  return {
    sequenceOrder,
    clusters,
    estimatedTravelTime: totalTravelTime,
    warnings,
  };
}

/**
 * Calculate geographic bounds of activities
 */
function calculateBounds(activities: Activity[]): ActivityCluster["locationBounds"] {
  const lats = activities.map((a) => a.location.lat);
  const lngs = activities.map((a) => a.location.lng);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/**
 * Check if activities should be in same round-trip group
 * Returns true if activities are within 5km of each other
 */
export function shouldGroupAsRoundTrip(act1: Activity, act2: Activity): boolean {
  const distance = calculateDistance(act1.location, act2.location);
  return distance < 5; // Within 5km
}

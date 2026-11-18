import { MatrimonyProfile } from '../types';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface CityGeoEntry extends GeoCoordinates {
  city: string;
  state: string;
  aliases?: string[];
}

export interface ProfileWithDistance {
  profile: MatrimonyProfile;
  distanceKm: number | null;
  isSameCity: boolean;
  isSameState: boolean;
  matchReason: 'same_city' | 'nearby' | 'same_state' | 'regional';
}

// Comprehensive coordinate lookup for Rathore Samaj directory locations and major Indian hubs
export const INDIAN_CITY_COORDS: CityGeoEntry[] = [
  { city: 'Akot', state: 'Maharashtra', lat: 21.0972, lng: 77.0580 },
  { city: 'Akola', state: 'Maharashtra', lat: 20.7002, lng: 77.0082 },
  { city: 'Amravati', state: 'Maharashtra', lat: 20.9320, lng: 77.7523 },
  { city: 'Paratwada', state: 'Maharashtra', lat: 21.3000, lng: 77.5167 },
  { city: 'Ratlam', state: 'Madhya Pradesh', lat: 23.3315, lng: 75.0367 },
  { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946, aliases: ['bengaluru', 'bangaluru'] },
  { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { city: 'Baran', state: 'Rajasthan', lat: 25.1011, lng: 76.5132 },
  { city: 'Khandwa', state: 'Madhya Pradesh', lat: 21.8314, lng: 76.3498 },
  { city: 'Beed', state: 'Maharashtra', lat: 18.9891, lng: 75.7601, aliases: ['bid', 'majalgaon', 'almel'] },
  { city: 'Nanded', state: 'Maharashtra', lat: 19.1383, lng: 77.3210 },
  { city: 'Jalna', state: 'Maharashtra', lat: 19.8347, lng: 75.8816 },
  {
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    lat: 19.8762,
    lng: 75.3433,
    aliases: ['aurangabad', 'sambhajinagar', 'waluj']
  },
  { city: 'Ahilyanagar', state: 'Maharashtra', lat: 19.0948, lng: 74.7480, aliases: ['ahmednagar', 'ahmadnagar', 'pathardi'] },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, aliases: ['shirur', 'loni kalbhor', 'pimpri', 'chinchwad'] },
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, aliases: ['navi mumbai', 'thane', 'kalyan', 'dombivli'] },
  { city: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898, aliases: ['bhagur', 'igatpuri'] },
  { city: 'Bhagur', state: 'Maharashtra', lat: 19.8886, lng: 73.8295 },
  { city: 'Igatpuri', state: 'Maharashtra', lat: 19.6967, lng: 73.5624 },
  { city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { city: 'Latur', state: 'Maharashtra', lat: 18.4088, lng: 76.5604 },
  { city: 'Parbhani', state: 'Maharashtra', lat: 19.2608, lng: 76.7748, aliases: ['manwat', 'jintur', 'gangakhed', 'purna'] },
  { city: 'Gangakhed', state: 'Maharashtra', lat: 18.9600, lng: 76.7486 },
  { city: 'Jintur', state: 'Maharashtra', lat: 19.6167, lng: 76.6833 },
  { city: 'Purna', state: 'Maharashtra', lat: 19.1786, lng: 77.0339 },
  { city: 'Hingoli', state: 'Maharashtra', lat: 19.7173, lng: 77.1494 },
  { city: 'Washim', state: 'Maharashtra', lat: 20.1119, lng: 77.1310, aliases: ['risod'] },
  { city: 'Solapur', state: 'Maharashtra', lat: 17.6599, lng: 75.9064, aliases: ['karmala'] },
  { city: 'Karmala', state: 'Maharashtra', lat: 18.4063, lng: 75.1973 },
  { city: 'Satara', state: 'Maharashtra', lat: 17.6805, lng: 74.0183 },
  { city: 'Dhule', state: 'Maharashtra', lat: 20.9042, lng: 74.7749 },
  { city: 'Majalgaon', state: 'Maharashtra', lat: 19.1589, lng: 76.2156 },
  { city: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885 },
  { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, aliases: ['sehore'] },
  { city: 'Sehore', state: 'Madhya Pradesh', lat: 23.2032, lng: 77.0844 },
  { city: 'Dewas', state: 'Madhya Pradesh', lat: 22.9676, lng: 76.0534 },
  { city: 'Mandsaur', state: 'Madhya Pradesh', lat: 24.0768, lng: 75.0693 },
  { city: 'Neemuch', state: 'Madhya Pradesh', lat: 24.4764, lng: 74.8624 },
  { city: 'Khargone', state: 'Madhya Pradesh', lat: 21.8235, lng: 75.6102 },
  { city: 'Barwani', state: 'Madhya Pradesh', lat: 22.0369, lng: 74.9006 },
  { city: 'Burhanpur', state: 'Madhya Pradesh', lat: 21.3104, lng: 76.2297 },
  { city: 'Betul', state: 'Madhya Pradesh', lat: 21.9008, lng: 77.9008 },
  { city: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { city: 'Guna', state: 'Madhya Pradesh', lat: 24.6473, lng: 77.3114 },
  { city: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { city: 'Mahasamund', state: 'Chhattisgarh', lat: 21.1066, lng: 82.0991 },
  { city: 'Mathura', state: 'Uttar Pradesh', lat: 27.4924, lng: 77.6737 },
  { city: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { city: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { city: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { city: 'Vijayapur', state: 'Karnataka', lat: 16.8302, lng: 75.7100, aliases: ['bijapur', 'indi', 'talikot', 'almel'] },
  { city: 'Indi', state: 'Karnataka', lat: 17.1763, lng: 75.9595 },
  { city: 'Talikot', state: 'Karnataka', lat: 16.4735, lng: 76.3109, aliases: ['talikoti'] },
  { city: 'Almel', state: 'Karnataka', lat: 16.9248, lng: 76.2028 },
  { city: 'Gulbarga', state: 'Karnataka', lat: 17.3297, lng: 76.8343, aliases: ['kalaburagi'] },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { city: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  { city: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, aliases: ['delhi', 'noida', 'gurgaon', 'gurugram'] }
];

const STATE_CENTROIDS: Record<string, GeoCoordinates> = {
  maharashtra: { lat: 19.7515, lng: 75.7139 },
  'madhya pradesh': { lat: 22.9734, lng: 78.6569 },
  rajasthan: { lat: 27.0238, lng: 74.2179 },
  karnataka: { lat: 15.3173, lng: 75.7139 },
  chhattisgarh: { lat: 21.2787, lng: 81.8661 },
  'uttar pradesh': { lat: 26.8467, lng: 80.9462 },
  gujarat: { lat: 22.2587, lng: 71.1924 },
  telangana: { lat: 18.1124, lng: 79.0193 },
  delhi: { lat: 28.6139, lng: 77.2090 }
};

export function haversineDistanceKm(a: GeoCoordinates, b: GeoCoordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function normalizePlace(value?: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function findCityEntry(cityQuery?: string, stateQuery?: string): CityGeoEntry | null {
  const cleanCity = normalizePlace(cityQuery);
  const cleanState = normalizePlace(stateQuery);
  if (!cleanCity && !cleanState) return null;

  if (cleanCity) {
    const exactMatch = INDIAN_CITY_COORDS.find((entry) => {
      if (normalizePlace(entry.city) === cleanCity) return true;
      if (entry.aliases?.some((alias) => normalizePlace(alias) === cleanCity)) return true;
      return false;
    });
    if (exactMatch) return exactMatch;

    const partialMatch = INDIAN_CITY_COORDS.find((entry) => {
      const entryName = normalizePlace(entry.city);
      if (cleanCity.includes(entryName) || entryName.includes(cleanCity)) return true;
      return entry.aliases?.some((alias) => {
        const a = normalizePlace(alias);
        return cleanCity.includes(a) || a.includes(cleanCity);
      });
    });
    if (partialMatch) return partialMatch;
  }

  return null;
}

export function resolveProfileCoordinates(profile: MatrimonyProfile): GeoCoordinates | null {
  const direct = findCityEntry(profile.city, profile.state);
  if (direct) return { lat: direct.lat, lng: direct.lng };

  if (profile.location) {
    const fromLocation = findCityEntry(profile.location, profile.state);
    if (fromLocation) return { lat: fromLocation.lat, lng: fromLocation.lng };
  }

  if (profile.native) {
    const fromNative = findCityEntry(profile.native, profile.state);
    if (fromNative) return { lat: fromNative.lat, lng: fromNative.lng };
  }

  const cleanState = normalizePlace(profile.state);
  if (cleanState && STATE_CENTROIDS[cleanState]) {
    return STATE_CENTROIDS[cleanState];
  }

  return null;
}

export function findNearestKnownCity(coords: GeoCoordinates): { city: string; state: string; distanceKm: number } {
  let best: CityGeoEntry = INDIAN_CITY_COORDS[0];
  let bestDist = Number.POSITIVE_INFINITY;

  for (const entry of INDIAN_CITY_COORDS) {
    const dist = haversineDistanceKm(coords, entry);
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }

  return {
    city: best.city,
    state: best.state,
    distanceKm: Math.round(bestDist)
  };
}

export async function reverseGeocodeCoordinates(
  coords: GeoCoordinates
): Promise<{ city: string; state: string; area?: string }> {
  const nearestFallback = findNearestKnownCity(coords);

  if (typeof fetch === 'undefined') {
    return { city: nearestFallback.city, state: nearestFallback.state };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 4500);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      coords.lat
    )}&lon=${encodeURIComponent(coords.lng)}&zoom=10&addressdetails=1&accept-language=en`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      return { city: nearestFallback.city, state: nearestFallback.state };
    }

    const data = await response.json();
    const addr = data?.address || {};
    const city =
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.county ||
      addr.state_district ||
      addr.village ||
      nearestFallback.city;
    const area = addr.suburb || addr.neighbourhood || addr.road || undefined;
    const state = addr.state || nearestFallback.state;

    return {
      city: String(city).trim() || nearestFallback.city,
      state: String(state).trim() || nearestFallback.state,
      area: area ? String(area).trim() : undefined
    };
  } catch {
    return { city: nearestFallback.city, state: nearestFallback.state };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function rankProfilesByLocation(
  profiles: MatrimonyProfile[],
  userCoords: GeoCoordinates,
  userCity?: string,
  userState?: string
): ProfileWithDistance[] {
  const cleanUserCity = normalizePlace(userCity);
  const cleanUserState = normalizePlace(userState);

  const enriched: ProfileWithDistance[] = profiles.map((profile) => {
    const profileCoords = resolveProfileCoordinates(profile);
    const rawDistance = profileCoords ? haversineDistanceKm(userCoords, profileCoords) : null;
    const distanceKm = rawDistance !== null ? Math.round(rawDistance) : null;

    const cleanProfileCity = normalizePlace(profile.city);
    const cleanProfileState = normalizePlace(profile.state);

    const isSameCity =
      Boolean(cleanUserCity && cleanProfileCity && (cleanProfileCity.includes(cleanUserCity) || cleanUserCity.includes(cleanProfileCity))) ||
      (distanceKm !== null && distanceKm <= 30);

    const isSameState = Boolean(
      cleanUserState && cleanProfileState && (cleanProfileState === cleanUserState || cleanProfileState.includes(cleanUserState))
    );

    let matchReason: ProfileWithDistance['matchReason'] = 'regional';
    if (isSameCity) {
      matchReason = 'same_city';
    } else if (distanceKm !== null && distanceKm <= 160) {
      matchReason = 'nearby';
    } else if (isSameState) {
      matchReason = 'same_state';
    }

    return {
      profile,
      distanceKm,
      isSameCity,
      isSameState,
      matchReason
    };
  });

  enriched.sort((a, b) => {
    if (a.isSameCity !== b.isSameCity) return a.isSameCity ? -1 : 1;
    if (a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm;
    }
    if (a.distanceKm !== null) return -1;
    if (b.distanceKm !== null) return 1;
    if (a.isSameState !== b.isSameState) return a.isSameState ? -1 : 1;
    return 0;
  });

  return enriched;
}

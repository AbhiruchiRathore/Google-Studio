import { useState, useEffect, useCallback } from 'react';
import {
  findCityEntry,
  GeoCoordinates,
  reverseGeocodeCoordinates
} from '../utils/locationMatcher';

export type LocationPermissionStatus =
  | 'idle'
  | 'prompt'
  | 'requesting'
  | 'granted'
  | 'manual'
  | 'denied'
  | 'unavailable'
  | 'error';

export interface UserLocationData {
  coords: GeoCoordinates;
  city: string;
  state: string;
  area?: string;
  source: 'gps' | 'manual';
  updatedAt: string;
}

const LOCATION_STORAGE_KEY = 'samaj_user_location';
const LOCATION_DISMISSED_KEY = 'samaj_location_prompt_dismissed';
const SIGNUP_LOCATION_ASKED_KEY = 'samaj_signup_location_asked';

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocationData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as UserLocationData;
      if (parsed?.coords && typeof parsed.coords.lat === 'number' && typeof parsed.coords.lng === 'number') {
        return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return null;
  });

  const [status, setStatus] = useState<LocationPermissionStatus>(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return 'unavailable';
    }
    if (location) {
      return location.source === 'manual' ? 'manual' : 'granted';
    }
    return 'prompt';
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [promptDismissed, setPromptDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(LOCATION_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [hasAskedOnSignup, setHasAskedOnSignup] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(SIGNUP_LOCATION_ASKED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const persistLocation = useCallback((next: UserLocationData | null) => {
    setLocation(next);
    if (typeof window === 'undefined') return;
    try {
      if (next) {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(LOCATION_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const requestDeviceLocation = useCallback(
    (options?: { silent?: boolean }) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        setStatus('unavailable');
        if (!options?.silent) {
          setErrorMessage('Location services are not supported on this device or browser.');
        }
        return;
      }

      if (!options?.silent) {
        setStatus('requesting');
        setErrorMessage(null);
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords: GeoCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          const resolved = await reverseGeocodeCoordinates(coords);
          const nextLocation: UserLocationData = {
            coords,
            city: resolved.city,
            state: resolved.state,
            area: resolved.area,
            source: 'gps',
            updatedAt: new Date().toISOString()
          };
          persistLocation(nextLocation);
          setStatus('granted');
          setErrorMessage(null);
        },
        (geoError) => {
          if (geoError.code === geoError.PERMISSION_DENIED) {
            setStatus('denied');
            if (!options?.silent) {
              setErrorMessage(
                'Location permission was blocked. Enable Location in browser site settings or pick your city below.'
              );
            }
            return;
          }
          if (!options?.silent) {
            setStatus('error');
            setErrorMessage(
              geoError.code === geoError.TIMEOUT
                ? 'Location request timed out. Please try again or pick your city.'
                : 'Unable to detect your GPS location right now. You can pick your city manually.'
            );
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    },
    [persistLocation]
  );

  // Sync browser Geolocation permission status on mount and auto-refresh if already granted
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }

    let active = true;
    const navWithPermissions = navigator as Navigator & {
      permissions?: { query: (desc: { name: PermissionName }) => Promise<PermissionStatus> };
    };

    if (navWithPermissions.permissions?.query) {
      navWithPermissions.permissions
        .query({ name: 'geolocation' })
        .then((perm) => {
          if (!active) return;
          if (perm.state === 'granted') {
            if (!location || location.source === 'gps') {
              requestDeviceLocation({ silent: true });
            }
          } else if (perm.state === 'denied' && (!location || location.source !== 'manual')) {
            setStatus('denied');
          }
        })
        .catch(() => {
          // Permissions API unsupported (e.g. some WebViews/Safari); keep interactive prompt state
        });
    }

    return () => {
      active = false;
    };
  }, []);

  const selectManualCity = useCallback(
    (cityQuery: string): boolean => {
      const entry = findCityEntry(cityQuery);
      if (!entry) return false;
      const next: UserLocationData = {
        coords: { lat: entry.lat, lng: entry.lng },
        city: entry.city,
        state: entry.state,
        source: 'manual',
        updatedAt: new Date().toISOString()
      };
      persistLocation(next);
      setStatus('manual');
      setErrorMessage(null);
      return true;
    },
    [persistLocation]
  );

  const markAskedOnSignup = useCallback(() => {
    setHasAskedOnSignup(true);
    try {
      localStorage.setItem(SIGNUP_LOCATION_ASKED_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }, []);

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true);
    setHasAskedOnSignup(true);
    try {
      localStorage.setItem(LOCATION_DISMISSED_KEY, '1');
      localStorage.setItem(SIGNUP_LOCATION_ASKED_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }, []);

  const clearLocation = useCallback(() => {
    persistLocation(null);
    setErrorMessage(null);
    setStatus('prompt');
  }, [persistLocation]);

  return {
    location,
    status,
    errorMessage,
    promptDismissed,
    hasAskedOnSignup,
    requestDeviceLocation,
    selectManualCity,
    dismissPrompt,
    markAskedOnSignup,
    clearLocation
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
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

export type LocationGrantMode = 'while_using' | 'once';
export type LocationAccuracyMode = 'precise' | 'approximate';

export interface UserLocationData {
  coords: GeoCoordinates;
  city: string;
  state: string;
  area?: string;
  source: 'gps' | 'manual';
  grantMode?: LocationGrantMode;
  accuracyMode?: LocationAccuracyMode;
  updatedAt: string;
}

interface CapacitorGeolocationPlugin {
  requestPermissions?: (options?: { permissions?: string[] }) => Promise<{
    location?: string;
    coarseLocation?: string;
  }>;
  getCurrentPosition?: (options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }) => Promise<{
    coords: { latitude: number; longitude: number };
  }>;
}

const LOCATION_STORAGE_KEY = 'samaj_user_location';
const LOCATION_SESSION_KEY = 'samaj_user_location_session';
const LOCATION_DISMISSED_KEY = 'samaj_location_prompt_dismissed';
const SIGNUP_LOCATION_ASKED_KEY = 'samaj_signup_location_asked';

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android/i.test(ua) || /; wv\)/i.test(ua);
}

function getCapacitorGeolocation(): CapacitorGeolocationPlugin | null {
  if (typeof window === 'undefined') return null;
  const cap = (window as unknown as {
    Capacitor?: { Plugins?: { Geolocation?: CapacitorGeolocationPlugin } };
  }).Capacitor;
  const geo = cap?.Plugins?.Geolocation;
  if (geo && typeof geo.getCurrentPosition === 'function') {
    return geo;
  }
  return null;
}

function getBrowserPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function readStoredLocation(): UserLocationData | null {
  if (typeof window === 'undefined') return null;
  try {
    const sessionRaw = sessionStorage.getItem(LOCATION_SESSION_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw) as UserLocationData;
      if (parsed?.coords && typeof parsed.coords.lat === 'number' && typeof parsed.coords.lng === 'number') {
        return parsed;
      }
    }
    const localRaw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as UserLocationData;
      if (parsed?.coords && typeof parsed.coords.lat === 'number' && typeof parsed.coords.lng === 'number') {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocationData | null>(() => readStoredLocation());

  const [status, setStatus] = useState<LocationPermissionStatus>(() => {
    if (typeof window === 'undefined') return 'unavailable';
    if (!getCapacitorGeolocation() && !('geolocation' in navigator)) {
      return 'unavailable';
    }
    const initial = readStoredLocation();
    if (initial) {
      return initial.source === 'manual' ? 'manual' : 'granted';
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

  const locationRef = useRef<UserLocationData | null>(location);
  locationRef.current = location;

  const persistLocation = useCallback(
    (next: UserLocationData | null, grantMode: LocationGrantMode = 'while_using') => {
      setLocation(next);
      if (typeof window === 'undefined') return;
      try {
        if (!next) {
          localStorage.removeItem(LOCATION_STORAGE_KEY);
          sessionStorage.removeItem(LOCATION_SESSION_KEY);
          return;
        }
        if (grantMode === 'once') {
          // Only-this-time grants apply strictly to the active app/browser session
          sessionStorage.setItem(LOCATION_SESSION_KEY, JSON.stringify(next));
          localStorage.removeItem(LOCATION_STORAGE_KEY);
        } else {
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(next));
          sessionStorage.removeItem(LOCATION_SESSION_KEY);
          localStorage.removeItem(LOCATION_DISMISSED_KEY);
          setPromptDismissed(false);
        }
      } catch {
        // ignore storage errors
      }
    },
    []
  );

  const requestDeviceLocation = useCallback(
    async (options?: {
      silent?: boolean;
      grantMode?: LocationGrantMode;
      accuracyMode?: LocationAccuracyMode;
    }) => {
      const grantMode: LocationGrantMode = options?.grantMode || 'while_using';
      const accuracyMode: LocationAccuracyMode = options?.accuracyMode || 'precise';
      const capGeo = getCapacitorGeolocation();
      const hasWebGeo = typeof window !== 'undefined' && 'geolocation' in navigator;

      if (!capGeo && !hasWebGeo) {
        setStatus('unavailable');
        if (!options?.silent) {
          setErrorMessage('Location services are not supported on this device or browser.');
        }
        return;
      }

      if (!capGeo && typeof window !== 'undefined' && window.isSecureContext === false) {
        setStatus('unavailable');
        if (!options?.silent) {
          setErrorMessage(
            'Browser location sharing requires HTTPS. Please pick your city manually below.'
          );
        }
        return;
      }

      if (!options?.silent) {
        setStatus('requesting');
        setErrorMessage(null);
      }

      try {
        let coords: GeoCoordinates;

        if (capGeo) {
          // Native Android Capacitor runtime permission dialog (ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION)
          if (capGeo.requestPermissions) {
            const permResult = await capGeo.requestPermissions({
              permissions: ['location', 'coarseLocation']
            });
            const locState = permResult?.location || permResult?.coarseLocation;
            if (locState === 'denied') {
              setStatus('denied');
              if (!options?.silent) {
                setErrorMessage(
                  'Location permission was denied. Enable Location under Android Settings > Apps > Rathore Rishtey > Permissions, or choose your city manually.'
                );
              }
              return;
            }
          }
          const pos = await capGeo.getCurrentPosition!({
            enableHighAccuracy: accuracyMode === 'precise',
            timeout: 12000,
            maximumAge: accuracyMode === 'precise' ? 60000 : 300000
          });
          coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
        } else {
          // Standard W3C Geolocation (Android WebView WebChromeClient, Android Chrome, PWA, Desktop Browsers)
          let position: GeolocationPosition;
          try {
            position = await getBrowserPosition({
              enableHighAccuracy: accuracyMode === 'precise',
              timeout: accuracyMode === 'precise' ? 12000 : 10000,
              maximumAge: accuracyMode === 'precise' ? 60000 : 300000
            });
          } catch (primaryErr) {
            const geoErr = primaryErr as GeolocationPositionError;
            // Fallback from high-accuracy GPS to network/coarse location if GPS times out indoors
            if (
              accuracyMode === 'precise' &&
              geoErr &&
              geoErr.code !== geoErr.PERMISSION_DENIED
            ) {
              position = await getBrowserPosition({
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
              });
            } else {
              throw primaryErr;
            }
          }

          coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        }

        const resolved = await reverseGeocodeCoordinates(coords);
        const nextLocation: UserLocationData = {
          coords,
          city: resolved.city,
          state: resolved.state,
          area: resolved.area,
          source: 'gps',
          grantMode,
          accuracyMode,
          updatedAt: new Date().toISOString()
        };

        persistLocation(nextLocation, grantMode);
        setStatus('granted');
        setErrorMessage(null);
      } catch (err) {
        const geoError = err as Partial<GeolocationPositionError> & { message?: string };
        const isPermissionDenied =
          geoError?.code === 1 ||
          (typeof geoError?.message === 'string' &&
            geoError.message.toLowerCase().includes('denied'));

        if (isPermissionDenied) {
          setStatus('denied');
          if (!options?.silent) {
            setErrorMessage(
              isAndroidDevice()
                ? 'Location permission is blocked. Open Android Settings > Apps > Permissions (or Chrome site settings) to allow Location, or pick your city below.'
                : 'Location permission was blocked. Click the lock/settings icon in your browser address bar to allow Location, or pick your city below.'
            );
          }
          return;
        }

        if (!options?.silent) {
          setStatus('error');
          setErrorMessage(
            geoError?.code === 3
              ? 'Location request timed out. Ensure GPS/Location is turned on and try again, or pick your city.'
              : 'Unable to detect your GPS location right now. You can pick your city manually.'
          );
        }
      }
    },
    [persistLocation]
  );

  // Sync browser Geolocation permission status on mount and react when OS/browser settings change
  useEffect(() => {
    const capGeo = getCapacitorGeolocation();
    const hasWebGeo = typeof window !== 'undefined' && 'geolocation' in navigator;

    if (!capGeo && !hasWebGeo) {
      setStatus('unavailable');
      return;
    }

    let active = true;
    let permStatusObj: PermissionStatus | null = null;
    const navWithPermissions = navigator as Navigator & {
      permissions?: { query: (desc: { name: PermissionName }) => Promise<PermissionStatus> };
    };

    const syncPermissionState = (state: PermissionState) => {
      if (!active) return;
      const current = locationRef.current;
      if (state === 'granted') {
        if (!current || (current.source === 'gps' && current.grantMode !== 'once')) {
          void requestDeviceLocation({ silent: true, grantMode: 'while_using' });
        } else if (current.source === 'gps') {
          setStatus('granted');
        }
      } else if (state === 'denied' && (!current || current.source !== 'manual')) {
        setStatus('denied');
      } else if (state === 'prompt' && !current) {
        setStatus('prompt');
      }
    };

    if (navWithPermissions.permissions?.query) {
      navWithPermissions.permissions
        .query({ name: 'geolocation' })
        .then((perm) => {
          if (!active) return;
          permStatusObj = perm;
          syncPermissionState(perm.state);
          perm.onchange = () => syncPermissionState(perm.state);
        })
        .catch(() => {
          // Permissions API unsupported (some Android WebViews / iOS Safari); rely on interactive flow
        });
    }

    return () => {
      active = false;
      if (permStatusObj) {
        permStatusObj.onchange = null;
      }
    };
  }, [requestDeviceLocation]);

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
      persistLocation(next, 'while_using');
      setStatus('manual');
      setErrorMessage(null);
      return true;
    },
    [persistLocation]
  );

  const hasAskedForOwner = useCallback((ownerKey?: string | null): boolean => {
    if (typeof window === 'undefined') return hasAskedOnSignup;
    try {
      if (ownerKey) {
        return localStorage.getItem(`${SIGNUP_LOCATION_ASKED_KEY}_${ownerKey}`) === '1';
      }
      return localStorage.getItem(SIGNUP_LOCATION_ASKED_KEY) === '1';
    } catch {
      return hasAskedOnSignup;
    }
  }, [hasAskedOnSignup]);

  const markAskedOnSignup = useCallback((ownerKey?: string | null) => {
    setHasAskedOnSignup(true);
    try {
      localStorage.setItem(SIGNUP_LOCATION_ASKED_KEY, '1');
      if (ownerKey) {
        localStorage.setItem(`${SIGNUP_LOCATION_ASKED_KEY}_${ownerKey}`, '1');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const dismissPrompt = useCallback((ownerKey?: string | null) => {
    setPromptDismissed(true);
    setHasAskedOnSignup(true);
    try {
      localStorage.setItem(LOCATION_DISMISSED_KEY, '1');
      localStorage.setItem(SIGNUP_LOCATION_ASKED_KEY, '1');
      if (ownerKey) {
        localStorage.setItem(`${SIGNUP_LOCATION_ASKED_KEY}_${ownerKey}`, '1');
      }
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
    hasAskedForOwner,
    requestDeviceLocation,
    selectManualCity,
    dismissPrompt,
    markAskedOnSignup,
    clearLocation
  };
}

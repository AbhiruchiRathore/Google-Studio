import { AuthSession, MatrimonyProfile, BusinessAd } from '../types';
import { INITIAL_PROFILES, INITIAL_ADS } from '../data/mockData';
import { sanitizePhoneInput } from './validation';

const DEFAULT_PROFILE_IDS = new Set(INITIAL_PROFILES.map((p) => p.id.toString()));
const DEFAULT_AD_IDS = new Set(INITIAL_ADS.map((a) => a.id.toString()));

/**
 * Computes a deterministic ownership key for the current logged-in session
 * so each login has isolated published profile/ad ownership and per-user storage.
 */
export function getSessionOwnerKey(session: AuthSession | null): string | null {
  if (!session) return null;

  if (session.username && session.username.trim()) {
    return `user:${session.username.trim().toLowerCase()}`;
  }
  if (session.email && session.email.trim()) {
    return `email:${session.email.trim().toLowerCase()}`;
  }
  const cleanPhone = sanitizePhoneInput(session.phone || '');
  if (cleanPhone.length === 10) {
    return `phone:${cleanPhone}`;
  }
  if (session.name && session.name.trim()) {
    return `name:${session.name.trim().toLowerCase()}`;
  }
  return null;
}

/**
 * Builds a session-scoped localStorage key so new/different users in the same
 * browser never inherit likes, admirers, media assets, or chats from prior sessions.
 */
export function getUserStorageKey(baseKey: string, session: AuthSession | null): string {
  const ownerKey = getSessionOwnerKey(session);
  return ownerKey ? `${baseKey}:${ownerKey}` : `${baseKey}:guest`;
}

/**
 * Checks whether a MatrimonyProfile belongs to the given AuthSession.
 * Seeded community profiles (INITIAL_PROFILES) are never owned by regular member logins.
 */
export function isProfileOwnedBySession(
  profile: MatrimonyProfile,
  session: AuthSession | null
): boolean {
  if (!session) return false;
  const ownerKey = getSessionOwnerKey(session);
  if (!ownerKey) return false;

  if (profile.ownerId) {
    return profile.ownerId === ownerKey;
  }

  // Never attribute seeded sample biodatas to a user's own "Published Profiles"
  if (DEFAULT_PROFILE_IDS.has(profile.id.toString())) {
    return false;
  }

  // Backward compatibility for custom profiles created before ownerId was stored
  const sessionPhone = sanitizePhoneInput(session.phone || '');
  const profilePhone = sanitizePhoneInput(profile.phone || profile.contact || '');
  if (sessionPhone.length === 10 && profilePhone.length === 10 && sessionPhone === profilePhone) {
    return true;
  }

  if (session.name && profile.name && profile.name.trim().toLowerCase() === session.name.trim().toLowerCase()) {
    return true;
  }

  return false;
}

/**
 * Checks whether a BusinessAd belongs to the given AuthSession.
 * Seeded directory/booklet ads (INITIAL_ADS) are never owned by regular member logins.
 */
export function isAdOwnedBySession(
  ad: BusinessAd,
  session: AuthSession | null
): boolean {
  if (!session) return false;
  const ownerKey = getSessionOwnerKey(session);
  if (!ownerKey) return false;

  if (ad.ownerId) {
    return ad.ownerId === ownerKey;
  }

  // Never attribute seeded community/booklet ads to a user's own "Published Ads"
  if (DEFAULT_AD_IDS.has(ad.id.toString())) {
    return false;
  }

  // Backward compatibility for custom ads created before ownerId was stored
  const sessionPhone = sanitizePhoneInput(session.phone || '');
  const adPhone = sanitizePhoneInput(ad.phone || '');
  if (sessionPhone.length === 10 && adPhone.length === 10 && sessionPhone === adPhone) {
    return true;
  }

  if (session.name && ad.owner && ad.owner.trim().toLowerCase() === session.name.trim().toLowerCase()) {
    return true;
  }

  return false;
}

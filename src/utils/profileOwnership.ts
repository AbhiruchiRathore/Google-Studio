import { AuthSession, MatrimonyProfile } from '../types';
import { INITIAL_PROFILES } from '../data/mockData';
import { sanitizePhoneInput } from './validation';

const DEFAULT_PROFILE_IDS = new Set(INITIAL_PROFILES.map((p) => p.id.toString()));

/**
 * Computes a deterministic ownership key for the current logged-in session
 * so each login has isolated published profile ownership and a strict 1-profile limit.
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

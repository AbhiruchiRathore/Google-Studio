import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AuthSession, BusinessAd, BusinessContact, MatrimonyProfile, SamajEvent } from '../types';
import { sanitizePhoneInput } from './validation';
import { isAdOwnedBySession, isProfileOwnedBySession } from './profileOwnership';
import { INITIAL_ADS, INITIAL_EVENTS, INITIAL_PROFILES } from '../data/mockData';
import { handleFirestoreError, OperationType } from './firebaseUserSync';

const MAX_MEDIA_FIELD_CHARS = 340_000;
const MAX_TOTAL_PROFILE_MEDIA_CHARS = 760_000;

const DEFAULT_PROFILE_IDS = new Set(INITIAL_PROFILES.map((p) => String(p.id)));
const DEFAULT_AD_IDS = new Set(INITIAL_ADS.map((a) => String(a.id)));
const DEFAULT_EVENT_IDS = new Set(
  INITIAL_EVENTS.map((e, idx) => String(e.id || idx))
);
const DEFAULT_EVENT_TITLES = new Set(
  INITIAL_EVENTS.map((e) => e.title.trim().toLowerCase())
);

export function extractReadableFirestoreError(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed?.error) return parsed.error;
    } catch {
      // not JSON
    }
    if (error.message) return error.message;
  }
  return 'Database connection error. Please check your internet and try again.';
}

const resolvedPrivateContacts = new Map<string, { phone: string; contact: string }>();

export function toValidDocId(rawId: number | string | undefined): string {
  const str = String(rawId ?? Date.now())
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);
  return str.length > 0 ? str : String(Date.now());
}

export function toClientItemId(docId: string): number | string {
  if (/^\d{1,15}$/.test(docId)) {
    const num = Number(docId);
    if (Number.isSafeInteger(num)) return num;
  }
  return docId;
}

function parseTimestampToIso(value: unknown, fallbackIso?: string): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      // ignore conversion errors
    }
  }
  return fallbackIso;
}

function getSortTimeMs(item: { createdAt?: string; id?: number | string }): number {
  if (item.createdAt) {
    const parsed = Date.parse(item.createdAt);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const numId = Number(item.id);
  if (Number.isFinite(numId) && numId > 1_000_000_000) {
    return numId;
  }
  return 0;
}

export async function resolveIsFirebaseAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  const email = (user.email || '').trim().toLowerCase();
  if (email === 'abhiruchirathore97@gmail.com' && user.emailVerified) {
    return true;
  }
  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

function safeMediaUrl(raw: string | undefined, fallback: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return fallback;
  if (trimmed.length <= MAX_MEDIA_FIELD_CHARS) return trimmed;
  return fallback;
}

function clampOptionalString(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

function mapDocToProfile(docId: string, data: Record<string, unknown>): MatrimonyProfile {
  const clientId = toClientItemId(docId);
  const cachedContact = resolvedPrivateContacts.get(docId);
  const gender: 'Male' | 'Female' = data.gender === 'Female' ? 'Female' : 'Male';
  const fallbackPhoto =
    gender === 'Female'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';

  const socialRaw = data.socialLinks as Record<string, unknown> | undefined;
  const socialLinks =
    socialRaw && typeof socialRaw === 'object'
      ? {
          ...(typeof socialRaw.linkedin === 'string' && socialRaw.linkedin ? { linkedin: socialRaw.linkedin } : {}),
          ...(typeof socialRaw.instagram === 'string' && socialRaw.instagram ? { instagram: socialRaw.instagram } : {}),
          ...(typeof socialRaw.website === 'string' && socialRaw.website ? { website: socialRaw.website } : {})
        }
      : undefined;

  const gallery = Array.isArray(data.gallery)
    ? data.gallery.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : undefined;

  return {
    id: clientId,
    name: typeof data.name === 'string' ? data.name : 'Samaj Member',
    age: typeof data.age === 'number' ? data.age : 26,
    gender,
    gotra: typeof data.gotra === 'string' ? data.gotra : 'Rathore',
    city: typeof data.city === 'string' ? data.city : 'Indore',
    state: typeof data.state === 'string' ? data.state : undefined,
    native: typeof data.native === 'string' ? data.native : undefined,
    location: typeof data.location === 'string' ? data.location : undefined,
    education: typeof data.education === 'string' ? data.education : 'Graduate',
    profession: typeof data.profession === 'string' ? data.profession : 'Professional',
    income: typeof data.income === 'string' ? data.income : undefined,
    height: typeof data.height === 'string' ? data.height : undefined,
    dob: typeof data.dob === 'string' ? data.dob : undefined,
    birthTime: typeof data.birthTime === 'string' ? data.birthTime : undefined,
    familyDetails: typeof data.familyDetails === 'string' ? data.familyDetails : undefined,
    about: typeof data.about === 'string' ? data.about : undefined,
    photo: typeof data.photo === 'string' && data.photo.trim() ? data.photo : fallbackPhoto,
    coverPhoto: typeof data.coverPhoto === 'string' && data.coverPhoto.trim() ? data.coverPhoto : undefined,
    gallery: gallery && gallery.length > 0 ? gallery : undefined,
    socialLinks: socialLinks && Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
    status: data.status === 'draft' || data.status === 'archived' ? data.status : 'active',
    visibility:
      data.visibility === 'verified_only' || data.visibility === 'private'
        ? data.visibility
        : 'public',
    verified: typeof data.verified === 'boolean' ? data.verified : true,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : undefined,
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : undefined,
    ownerName: typeof data.ownerName === 'string' ? data.ownerName : undefined,
    contact: cachedContact?.contact || '',
    phone: cachedContact?.phone || '',
    createdAt: parseTimestampToIso(data.createdAt, typeof data.createdAtIso === 'string' ? data.createdAtIso : undefined),
    updatedAt: parseTimestampToIso(data.updatedAt)
  };
}

function buildProfileFirestoreFields(
  profile: MatrimonyProfile,
  docId: string,
  ownerUid: string,
  ownerId: string,
  ownerName?: string
): Record<string, unknown> {
  const gender: 'Male' | 'Female' = profile.gender === 'Female' ? 'Female' : 'Male';
  const fallbackPhoto =
    gender === 'Female'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';

  const numericAge = Number(profile.age);
  const clampedAge = Number.isFinite(numericAge)
    ? Math.min(99, Math.max(18, Math.round(numericAge)))
    : 26;

  const photo = safeMediaUrl(profile.photo, fallbackPhoto);
  let mediaBudget = photo.length;

  const coverRaw = clampOptionalString(profile.coverPhoto, MAX_MEDIA_FIELD_CHARS);
  const coverPhoto =
    coverRaw && mediaBudget + coverRaw.length <= MAX_TOTAL_PROFILE_MEDIA_CHARS
      ? coverRaw
      : undefined;
  if (coverPhoto) mediaBudget += coverPhoto.length;

  const galleryItems: string[] = [];
  if (Array.isArray(profile.gallery)) {
    for (const rawImg of profile.gallery) {
      if (galleryItems.length >= 5) break;
      if (typeof rawImg !== 'string') continue;
      const trimmed = rawImg.trim();
      if (!trimmed || trimmed.length > MAX_MEDIA_FIELD_CHARS) continue;
      if (mediaBudget + trimmed.length > MAX_TOTAL_PROFILE_MEDIA_CHARS) continue;
      galleryItems.push(trimmed);
      mediaBudget += trimmed.length;
    }
  }

  const cleanSocial: Record<string, string> = {};
  if (profile.socialLinks) {
    const ln = clampOptionalString(profile.socialLinks.linkedin, 300);
    const ig = clampOptionalString(profile.socialLinks.instagram, 120);
    const web = clampOptionalString(profile.socialLinks.website, 300);
    if (ln) cleanSocial.linkedin = ln;
    if (ig) cleanSocial.instagram = ig;
    if (web) cleanSocial.website = web;
  }

  const payload: Record<string, unknown> = {
    id: docId,
    ownerUid,
    ownerId: (profile.ownerId || ownerId || ownerUid).trim().slice(0, 160),
    name: (profile.name || 'Member').trim().slice(0, 120) || 'Member',
    age: clampedAge,
    gender,
    gotra: (profile.gotra || 'Rathore').trim().slice(0, 80) || 'Rathore',
    city: (profile.city || 'Indore').trim().slice(0, 100) || 'Indore',
    education: (profile.education || 'Graduate').trim().slice(0, 200) || 'Graduate',
    profession: (profile.profession || 'Professional').trim().slice(0, 200) || 'Professional',
    photo,
    status: profile.status === 'draft' || profile.status === 'archived' ? profile.status : 'active',
    verified: typeof profile.verified === 'boolean' ? profile.verified : true
  };

  const resolvedOwnerName = clampOptionalString(profile.ownerName || ownerName, 120);
  if (resolvedOwnerName) payload.ownerName = resolvedOwnerName;

  const optionalMap: Array<[string, string | undefined]> = [
    ['state', clampOptionalString(profile.state, 100)],
    ['native', clampOptionalString(profile.native, 120)],
    ['location', clampOptionalString(profile.location, 180)],
    ['income', clampOptionalString(profile.income, 100)],
    ['height', clampOptionalString(profile.height, 40)],
    ['dob', clampOptionalString(profile.dob, 40)],
    ['birthTime', clampOptionalString(profile.birthTime, 40)],
    ['familyDetails', clampOptionalString(profile.familyDetails, 2000)],
    ['about', clampOptionalString(profile.about, 2000)],
    ['createdAtIso', clampOptionalString(profile.createdAt, 64)]
  ];

  for (const [key, val] of optionalMap) {
    if (val) payload[key] = val;
  }

  if (coverPhoto) payload.coverPhoto = coverPhoto;
  if (galleryItems.length > 0) payload.gallery = galleryItems;
  if (Object.keys(cleanSocial).length > 0) payload.socialLinks = cleanSocial;
  if (profile.visibility) payload.visibility = profile.visibility;

  return payload;
}

export async function saveProfileToFirestore(
  profile: MatrimonyProfile,
  authUser: User,
  sessionOwnerKey: string,
  ownerName?: string,
  isAdminAction = false
): Promise<void> {
  const docId = toValidDocId(profile.id);
  const profilePath = `profiles/${docId}`;
  const profileRef = doc(db, 'profiles', docId);
  const contactRef = doc(db, 'profiles', docId, 'private', 'contact');

  const rawContact = sanitizePhoneInput(profile.phone || profile.contact || '') || (profile.contact || '').trim();
  const hasValidContact = rawContact.length >= 5 && rawContact.length <= 30;

  try {
    const existingSnap = await getDoc(profileRef);
    const batch = writeBatch(db);

    if (!existingSnap.exists()) {
      const fullPayload = buildProfileFirestoreFields(profile, docId, authUser.uid, sessionOwnerKey, ownerName);
      batch.set(profileRef, {
        ...fullPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (hasValidContact) {
        batch.set(contactRef, {
          ownerUid: authUser.uid,
          phone: rawContact.slice(0, 30),
          contact: rawContact.slice(0, 30),
          updatedAt: serverTimestamp()
        });
        resolvedPrivateContacts.set(docId, {
          phone: rawContact.slice(0, 30),
          contact: rawContact.slice(0, 30)
        });
      }
    } else {
      const existingData = existingSnap.data();
      const existingOwnerUid = typeof existingData?.ownerUid === 'string' ? existingData.ownerUid : authUser.uid;
      const fullPayload = buildProfileFirestoreFields(profile, docId, existingOwnerUid, sessionOwnerKey, ownerName);

      // Extract only allowed mutable fields for updateDoc so ownerUid/id/createdAt remain untouched
      const mutableUpdate: Record<string, unknown> = {
        name: fullPayload.name,
        age: fullPayload.age,
        gender: fullPayload.gender,
        gotra: fullPayload.gotra,
        city: fullPayload.city,
        education: fullPayload.education,
        profession: fullPayload.profession,
        photo: fullPayload.photo,
        status: fullPayload.status,
        updatedAt: serverTimestamp()
      };

      const mutableOptionalKeys = [
        'ownerName',
        'state',
        'native',
        'location',
        'income',
        'height',
        'dob',
        'birthTime',
        'familyDetails',
        'about',
        'coverPhoto',
        'gallery',
        'socialLinks',
        'visibility'
      ];

      for (const key of mutableOptionalKeys) {
        if (fullPayload[key] !== undefined) {
          mutableUpdate[key] = fullPayload[key];
        }
      }

      if (isAdminAction && typeof profile.verified === 'boolean') {
        mutableUpdate.verified = profile.verified;
      }

      batch.update(profileRef, mutableUpdate);

      if (hasValidContact && existingOwnerUid === authUser.uid) {
        batch.set(contactRef, {
          ownerUid: authUser.uid,
          phone: rawContact.slice(0, 30),
          contact: rawContact.slice(0, 30),
          updatedAt: serverTimestamp()
        });
        resolvedPrivateContacts.set(docId, {
          phone: rawContact.slice(0, 30),
          contact: rawContact.slice(0, 30)
        });
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath, auth);
  }
}

export async function deleteProfileFromFirestore(profileId: number | string): Promise<void> {
  const docId = toValidDocId(profileId);
  if (DEFAULT_PROFILE_IDS.has(docId)) return;

  const profileRef = doc(db, 'profiles', docId);
  const contactRef = doc(db, 'profiles', docId, 'private', 'contact');

  try {
    const snap = await getDoc(profileRef);
    if (!snap.exists()) return;

    await deleteDoc(contactRef).catch(() => undefined);
    await deleteDoc(profileRef);
    resolvedPrivateContacts.delete(docId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `profiles/${docId}`, auth);
  }
}

export async function fetchPrivateContactForProfile(
  profileId: number | string
): Promise<{ phone: string; contact: string } | null> {
  const docId = toValidDocId(profileId);
  const cached = resolvedPrivateContacts.get(docId);
  if (cached && cached.phone) return cached;

  try {
    const snap = await getDoc(doc(db, 'profiles', docId, 'private', 'contact'));
    if (!snap.exists()) return null;
    const data = snap.data();
    const phone = typeof data.phone === 'string' ? data.phone : '';
    const contact = typeof data.contact === 'string' ? data.contact : phone;
    if (phone || contact) {
      const result = { phone, contact: contact || phone };
      resolvedPrivateContacts.set(docId, result);
      return result;
    }
  } catch {
    // Contact may not be unlocked yet
  }
  return null;
}

export async function unlockAndFetchProfileContact(
  profileId: number | string,
  authUser: User
): Promise<{ phone: string; contact: string } | null> {
  const docId = toValidDocId(profileId);
  if (DEFAULT_PROFILE_IDS.has(docId)) {
    return null;
  }

  const unlockPath = `profiles/${docId}/unlocks/${authUser.uid}`;
  try {
    const profileSnap = await getDoc(doc(db, 'profiles', docId));
    if (!profileSnap.exists()) return null;

    const unlockRef = doc(db, 'profiles', docId, 'unlocks', authUser.uid);
    const unlockSnap = await getDoc(unlockRef);
    if (!unlockSnap.exists()) {
      await setDoc(unlockRef, {
        uid: authUser.uid,
        unlockedAt: serverTimestamp()
      });
    }

    const contactRef = doc(db, 'profiles', docId, 'private', 'contact');
    const contactSnap = await getDoc(contactRef);
    if (contactSnap.exists()) {
      const data = contactSnap.data();
      const phone = typeof data.phone === 'string' ? data.phone : '';
      const contact = typeof data.contact === 'string' ? data.contact : phone;
      if (phone || contact) {
        const result = { phone, contact: contact || phone };
        resolvedPrivateContacts.set(docId, result);
        return result;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, unlockPath, auth);
  }
  return null;
}

export function subscribeDirectoryProfiles(
  authUser: User | null,
  isFirebaseAdmin: boolean,
  unlockedIds: (number | string)[],
  onUpdate: (profiles: MatrimonyProfile[]) => void,
  onFatalError?: (err: Error) => void
): Unsubscribe {
  const bucketPublic = new Map<string, MatrimonyProfile>();
  const bucketOwned = new Map<string, MatrimonyProfile>();
  const bucketAdmin = new Map<string, MatrimonyProfile>();
  const unsubscribers: Unsubscribe[] = [];
  const hydratedContactIds = new Set<string>();
  const unlockedSet = new Set(unlockedIds.map((id) => toValidDocId(id)));

  const emitMerged = () => {
    const merged = new Map<string, MatrimonyProfile>();
    bucketPublic.forEach((p, id) => merged.set(id, p));
    bucketOwned.forEach((p, id) => merged.set(id, p));
    bucketAdmin.forEach((p, id) => merged.set(id, p));

    const sorted = Array.from(merged.values()).sort((a, b) => getSortTimeMs(b) - getSortTimeMs(a));
    onUpdate(sorted);

    // Lazily fetch private contact numbers for owned/unlocked/admin profiles
    if (authUser) {
      const toFetch: string[] = [];
      for (const [docId] of merged) {
        const isOwned = bucketOwned.has(docId);
        const isUnlocked = unlockedSet.has(docId);
        if ((isOwned || isUnlocked || isFirebaseAdmin) && !resolvedPrivateContacts.has(docId) && !hydratedContactIds.has(docId)) {
          hydratedContactIds.add(docId);
          toFetch.push(docId);
        }
      }
      if (toFetch.length > 0) {
        void Promise.all(
          toFetch.map(async (docId) => {
            const contactData = await fetchPrivateContactForProfile(docId);
            if (contactData) {
              const target = bucketOwned.get(docId) || bucketAdmin.get(docId) || bucketPublic.get(docId);
              if (target) {
                target.phone = contactData.phone;
                target.contact = contactData.contact;
              }
            }
          })
        ).then(() => {
          const updated = Array.from(merged.values()).map((p) => {
            const c = resolvedPrivateContacts.get(toValidDocId(p.id));
            return c ? { ...p, phone: c.phone, contact: c.contact } : p;
          });
          updated.sort((a, b) => getSortTimeMs(b) - getSortTimeMs(a));
          onUpdate(updated);
        });
      }
    }
  };

  const handleSnapshotError = (error: unknown, path: string) => {
    try {
      handleFirestoreError(error, OperationType.LIST, path, auth);
    } catch (wrapped) {
      if (onFatalError && wrapped instanceof Error) {
        onFatalError(wrapped);
      }
    }
  };

  if (isFirebaseAdmin) {
    const adminQ = collection(db, 'profiles');
    unsubscribers.push(
      onSnapshot(
        adminQ,
        (snapshot) => {
          bucketAdmin.clear();
          snapshot.forEach((snap) => {
            bucketAdmin.set(snap.id, mapDocToProfile(snap.id, snap.data()));
          });
          emitMerged();
        },
        (error) => handleSnapshotError(error, 'profiles')
      )
    );
  } else {
    const publicQ = query(
      collection(db, 'profiles'),
      where('status', '==', 'active'),
      where('verified', '==', true)
    );
    unsubscribers.push(
      onSnapshot(
        publicQ,
        (snapshot) => {
          bucketPublic.clear();
          snapshot.forEach((snap) => {
            bucketPublic.set(snap.id, mapDocToProfile(snap.id, snap.data()));
          });
          emitMerged();
        },
        (error) => handleSnapshotError(error, 'profiles')
      )
    );

    if (authUser?.uid) {
      const ownedQ = query(
        collection(db, 'profiles'),
        where('ownerUid', '==', authUser.uid)
      );
      unsubscribers.push(
        onSnapshot(
          ownedQ,
          (snapshot) => {
            bucketOwned.clear();
            snapshot.forEach((snap) => {
              bucketOwned.set(snap.id, mapDocToProfile(snap.id, snap.data()));
            });
            emitMerged();
          },
          (error) => handleSnapshotError(error, 'profiles')
        )
      );
    }
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

function mapDocToAd(docId: string, data: Record<string, unknown>): BusinessAd {
  const contacts = Array.isArray(data.contacts)
    ? data.contacts.filter(
        (c): c is BusinessContact =>
          Boolean(c) &&
          typeof c === 'object' &&
          typeof (c as BusinessContact).name === 'string' &&
          typeof (c as BusinessContact).phone === 'string'
      )
    : undefined;

  return {
    id: toClientItemId(docId),
    title: typeof data.title === 'string' ? data.title : 'Samaj Business',
    owner: typeof data.owner === 'string' ? data.owner : 'Owner',
    category: typeof data.category === 'string' ? data.category : 'Business',
    city: typeof data.city === 'string' ? data.city : undefined,
    address: typeof data.address === 'string' ? data.address : 'Main Market',
    phone: typeof data.phone === 'string' ? data.phone : '',
    contacts: contacts && contacts.length > 0 ? contacts : undefined,
    tagline: typeof data.tagline === 'string' ? data.tagline : undefined,
    offer: typeof data.offer === 'string' ? data.offer : undefined,
    description: typeof data.description === 'string' ? data.description : undefined,
    rating: typeof data.rating === 'string' ? data.rating : '5.0 ★',
    isFeatured: Boolean(data.isFeatured),
    adTier:
      data.adTier === 'featured' || data.adTier === 'spotlight'
        ? data.adTier
        : 'standard',
    adPricePaid: typeof data.adPricePaid === 'number' ? data.adPricePaid : undefined,
    status:
      data.status === 'draft' || data.status === 'paused' ? data.status : 'active',
    banner:
      typeof data.banner === 'string' && data.banner.trim()
        ? data.banner
        : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    bannerFit: data.bannerFit === 'contain' ? 'contain' : 'cover',
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : undefined,
    ownerName: typeof data.ownerName === 'string' ? data.ownerName : undefined,
    createdAt: parseTimestampToIso(data.createdAt, typeof data.createdAtIso === 'string' ? data.createdAtIso : undefined),
    updatedAt: parseTimestampToIso(data.updatedAt)
  };
}

function buildAdFirestoreFields(
  ad: BusinessAd,
  docId: string,
  ownerUid: string,
  ownerId: string,
  ownerName?: string
): Record<string, unknown> {
  const defaultBanner = ad.isFeatured
    ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'
    : 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=600&q=80';

  const cleanContacts: BusinessContact[] = Array.isArray(ad.contacts)
    ? ad.contacts
        .slice(0, 5)
        .filter((c) => c && typeof c.name === 'string' && typeof c.phone === 'string')
        .map((c) => ({
          name: c.name.trim().slice(0, 120) || 'Contact',
          phone: c.phone.trim().slice(0, 30)
        }))
    : [];

  const payload: Record<string, unknown> = {
    id: docId,
    ownerUid,
    ownerId: (ad.ownerId || ownerId || ownerUid).trim().slice(0, 160),
    title: (ad.title || 'Samaj Business').trim().slice(0, 160) || 'Samaj Business',
    owner: (ad.owner || 'Samaj Business Owner').trim().slice(0, 120) || 'Samaj Business Owner',
    category: (ad.category || 'Retail & Shopping').trim().slice(0, 100) || 'Retail & Shopping',
    address: (ad.address || 'Main Market').trim().slice(0, 300) || 'Main Market',
    status: ad.status === 'draft' || ad.status === 'paused' ? ad.status : 'active',
    banner: safeMediaUrl(ad.banner, defaultBanner)
  };

  const resolvedOwnerName = clampOptionalString(ad.ownerName || ownerName, 120);
  if (resolvedOwnerName) payload.ownerName = resolvedOwnerName;

  const optionalStrings: Array<[string, string | undefined]> = [
    ['city', clampOptionalString(ad.city, 100)],
    ['phone', clampOptionalString(ad.phone, 40)],
    ['tagline', clampOptionalString(ad.tagline, 240)],
    ['offer', clampOptionalString(ad.offer, 200)],
    ['description', clampOptionalString(ad.description, 2000)],
    ['rating', clampOptionalString(ad.rating, 30)],
    ['createdAtIso', clampOptionalString(ad.createdAt, 64)]
  ];

  for (const [k, v] of optionalStrings) {
    if (v) payload[k] = v;
  }

  if (cleanContacts.length > 0) payload.contacts = cleanContacts;
  if (typeof ad.isFeatured === 'boolean') payload.isFeatured = ad.isFeatured;
  if (ad.adTier === 'standard' || ad.adTier === 'featured' || ad.adTier === 'spotlight') {
    payload.adTier = ad.adTier;
  }
  if (typeof ad.adPricePaid === 'number' && Number.isFinite(ad.adPricePaid)) {
    payload.adPricePaid = ad.adPricePaid;
  }
  if (ad.bannerFit === 'cover' || ad.bannerFit === 'contain') {
    payload.bannerFit = ad.bannerFit;
  }

  return payload;
}

export async function saveAdToFirestore(
  ad: BusinessAd,
  authUser: User,
  sessionOwnerKey: string,
  ownerName?: string
): Promise<void> {
  const docId = toValidDocId(ad.id);
  const adPath = `ads/${docId}`;
  const adRef = doc(db, 'ads', docId);

  try {
    const existingSnap = await getDoc(adRef);
    if (!existingSnap.exists()) {
      const fullPayload = buildAdFirestoreFields(ad, docId, authUser.uid, sessionOwnerKey, ownerName);
      await setDoc(adRef, {
        ...fullPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const existingData = existingSnap.data();
      const existingOwnerUid = typeof existingData?.ownerUid === 'string' ? existingData.ownerUid : authUser.uid;
      const fullPayload = buildAdFirestoreFields(ad, docId, existingOwnerUid, sessionOwnerKey, ownerName);

      const mutableUpdate: Record<string, unknown> = {
        title: fullPayload.title,
        owner: fullPayload.owner,
        category: fullPayload.category,
        address: fullPayload.address,
        status: fullPayload.status,
        banner: fullPayload.banner,
        updatedAt: serverTimestamp()
      };

      const mutableKeys = [
        'ownerName',
        'city',
        'phone',
        'contacts',
        'tagline',
        'offer',
        'description',
        'isFeatured',
        'adTier',
        'adPricePaid',
        'bannerFit'
      ];
      for (const k of mutableKeys) {
        if (fullPayload[k] !== undefined) {
          mutableUpdate[k] = fullPayload[k];
        }
      }

      await updateDoc(adRef, mutableUpdate);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, adPath, auth);
  }
}

export async function deleteAdFromFirestore(adId: number | string): Promise<void> {
  const docId = toValidDocId(adId);
  if (DEFAULT_AD_IDS.has(docId)) return;

  const adRef = doc(db, 'ads', docId);
  try {
    const snap = await getDoc(adRef);
    if (!snap.exists()) return;
    await deleteDoc(adRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `ads/${docId}`, auth);
  }
}

export function subscribeDirectoryAds(
  authUser: User | null,
  isFirebaseAdmin: boolean,
  onUpdate: (ads: BusinessAd[]) => void,
  onFatalError?: (err: Error) => void
): Unsubscribe {
  const bucketPublic = new Map<string, BusinessAd>();
  const bucketOwned = new Map<string, BusinessAd>();
  const bucketAdmin = new Map<string, BusinessAd>();
  const unsubscribers: Unsubscribe[] = [];

  const emitMerged = () => {
    const merged = new Map<string, BusinessAd>();
    bucketPublic.forEach((a, id) => merged.set(id, a));
    bucketOwned.forEach((a, id) => merged.set(id, a));
    bucketAdmin.forEach((a, id) => merged.set(id, a));

    const sorted = Array.from(merged.values()).sort((a, b) => getSortTimeMs(b) - getSortTimeMs(a));
    onUpdate(sorted);
  };

  const handleSnapshotError = (error: unknown, path: string) => {
    try {
      handleFirestoreError(error, OperationType.LIST, path, auth);
    } catch (wrapped) {
      if (onFatalError && wrapped instanceof Error) {
        onFatalError(wrapped);
      }
    }
  };

  if (isFirebaseAdmin) {
    unsubscribers.push(
      onSnapshot(
        collection(db, 'ads'),
        (snapshot) => {
          bucketAdmin.clear();
          snapshot.forEach((snap) => bucketAdmin.set(snap.id, mapDocToAd(snap.id, snap.data())));
          emitMerged();
        },
        (error) => handleSnapshotError(error, 'ads')
      )
    );
  } else {
    unsubscribers.push(
      onSnapshot(
        query(collection(db, 'ads'), where('status', '==', 'active')),
        (snapshot) => {
          bucketPublic.clear();
          snapshot.forEach((snap) => bucketPublic.set(snap.id, mapDocToAd(snap.id, snap.data())));
          emitMerged();
        },
        (error) => handleSnapshotError(error, 'ads')
      )
    );

    if (authUser?.uid) {
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'ads'), where('ownerUid', '==', authUser.uid)),
          (snapshot) => {
            bucketOwned.clear();
            snapshot.forEach((snap) => bucketOwned.set(snap.id, mapDocToAd(snap.id, snap.data())));
            emitMerged();
          },
          (error) => handleSnapshotError(error, 'ads')
        )
      );
    }
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

function mapDocToEvent(docId: string, data: Record<string, unknown>): SamajEvent {
  return {
    id: toClientItemId(docId),
    title: typeof data.title === 'string' ? data.title : 'Samaj Event',
    date: typeof data.date === 'string' ? data.date : '',
    time: typeof data.time === 'string' ? data.time : undefined,
    location: typeof data.location === 'string' ? data.location : '',
    venue: typeof data.venue === 'string' ? data.venue : undefined,
    organizedBy: typeof data.organizedBy === 'string' ? data.organizedBy : undefined,
    description: typeof data.description === 'string' ? data.description : '',
    badge: typeof data.badge === 'string' ? data.badge : undefined
  };
}

export async function saveEventToFirestore(
  event: SamajEvent,
  authUser: User,
  options?: { createAnnouncement?: boolean }
): Promise<void> {
  const docId = toValidDocId(event.id || Date.now());
  const eventPath = `events/${docId}`;
  const eventRef = doc(db, 'events', docId);
  const cleanTitle = (event.title || 'Samaj Event').trim().slice(0, 180) || 'Samaj Event';
  const cleanDate = (event.date || 'Upcoming').trim().slice(0, 80) || 'Upcoming';
  const shouldCreateAnnouncement = options?.createAnnouncement !== false;

  const payload: Record<string, unknown> = {
    id: docId,
    ownerUid: authUser.uid,
    title: cleanTitle,
    date: cleanDate,
    location: (event.location || 'Indore').trim().slice(0, 200) || 'Indore',
    description:
      (event.description || event.title || 'Community Samaj Event').trim().slice(0, 2000) ||
      'Community Samaj Event',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const optTime = clampOptionalString(event.time, 60);
  const optVenue = clampOptionalString(event.venue, 200);
  const optOrg = clampOptionalString(event.organizedBy, 160);
  const optBadge = clampOptionalString(event.badge, 60);

  if (optTime) payload.time = optTime;
  if (optVenue) payload.venue = optVenue;
  if (optOrg) payload.organizedBy = optOrg;
  if (optBadge) payload.badge = optBadge;

  try {
    const existingEventSnap = await getDoc(eventRef);
    const batch = writeBatch(db);
    batch.set(eventRef, payload);

    if (shouldCreateAnnouncement && !existingEventSnap.exists()) {
      const annId = `ann_evt_${docId}`.slice(0, 128);
      batch.set(doc(db, 'announcements', annId), {
        id: annId,
        type: 'event',
        title: `New Event: ${cleanTitle}`.slice(0, 160),
        titleHi: `नया कार्यक्रम: ${cleanTitle}`.slice(0, 200),
        body: `New event: ${cleanTitle} on ${cleanDate}`.slice(0, 1000),
        bodyHi: `नया कार्यक्रम: ${cleanTitle} (${cleanDate})`.slice(0, 1200),
        eventId: docId,
        eventDate: cleanDate,
        targetTab: 'events',
        authorUid: authUser.uid,
        ...(authUser.displayName ? { authorName: authUser.displayName.trim().slice(0, 120) } : {}),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, eventPath, auth);
  }
}

export function subscribeSamajEvents(
  onUpdate: (events: SamajEvent[]) => void,
  onFatalError?: (err: Error) => void
): Unsubscribe {
  const eventsQ = query(collection(db, 'events'), where('status', '==', 'active'));
  return onSnapshot(
    eventsQ,
    (snapshot) => {
      const list: Array<SamajEvent & { _sortMs: number }> = [];
      snapshot.forEach((snap) => {
        const data = snap.data();
        const mapped = mapDocToEvent(snap.id, data);
        const createdIso = parseTimestampToIso(data.createdAt);
        list.push({
          ...mapped,
          _sortMs: getSortTimeMs({ id: mapped.id, createdAt: createdIso })
        });
      });
      list.sort((a, b) => b._sortMs - a._sortMs);
      onUpdate(list.map(({ _sortMs: _ignored, ...ev }) => ev));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'events', auth);
      } catch (wrapped) {
        if (onFatalError && wrapped instanceof Error) {
          onFatalError(wrapped);
        }
      }
    }
  );
}

const backfilledUsers = new Set<string>();

/**
 * Uploads any previously created local-only profiles, ads, or events owned by the signed-in user
 * to Cloud Firestore if they do not yet exist in the cloud directory.
 */
export async function backfillLocalOwnedItemsToFirestore(
  session: AuthSession | null,
  authUser: User | null,
  sessionOwnerKey: string | null
): Promise<void> {
  if (!session || !authUser || !sessionOwnerKey) return;
  if (backfilledUsers.has(authUser.uid)) return;

  const ownerName = session.name || session.username || session.email || 'Member';
  let hadFailure = false;

  try {
    const rawProfiles = localStorage.getItem('samaj_profiles');
    if (rawProfiles) {
      const parsed = JSON.parse(rawProfiles) as MatrimonyProfile[];
      if (Array.isArray(parsed)) {
        for (const prof of parsed) {
          const docId = toValidDocId(prof.id);
          if (DEFAULT_PROFILE_IDS.has(docId)) continue;
          if (!isProfileOwnedBySession(prof, session)) continue;

          const existing = await getDoc(doc(db, 'profiles', docId)).catch(() => null);
          if (!existing) {
            hadFailure = true;
            continue;
          }
          if (!existing.exists()) {
            await saveProfileToFirestore(prof, authUser, sessionOwnerKey, ownerName, false).catch(
              (err) => {
                hadFailure = true;
                console.warn('Profile backfill skipped:', err);
              }
            );
          }
        }
      }
    }
  } catch (err) {
    hadFailure = true;
    console.warn('Local profile backfill error:', err);
  }

  try {
    const rawAds = localStorage.getItem('samaj_ads');
    if (rawAds) {
      const parsed = JSON.parse(rawAds) as BusinessAd[];
      if (Array.isArray(parsed)) {
        for (const ad of parsed) {
          const docId = toValidDocId(ad.id);
          if (DEFAULT_AD_IDS.has(docId)) continue;
          if (!isAdOwnedBySession(ad, session)) continue;

          const existing = await getDoc(doc(db, 'ads', docId)).catch(() => null);
          if (!existing) {
            hadFailure = true;
            continue;
          }
          if (!existing.exists()) {
            await saveAdToFirestore(ad, authUser, sessionOwnerKey, ownerName).catch(
              (err) => {
                hadFailure = true;
                console.warn('Ad backfill skipped:', err);
              }
            );
          }
        }
      }
    }
  } catch (err) {
    hadFailure = true;
    console.warn('Local ad backfill error:', err);
  }

  try {
    const rawEvents = localStorage.getItem('samaj_events');
    if (rawEvents) {
      const parsed = JSON.parse(rawEvents) as SamajEvent[];
      if (Array.isArray(parsed)) {
        for (const ev of parsed) {
          const docId = toValidDocId(ev.id);
          const titleKey = (ev.title || '').trim().toLowerCase();
          if (!ev.id || DEFAULT_EVENT_IDS.has(docId) || DEFAULT_EVENT_TITLES.has(titleKey)) continue;
          const existing = await getDoc(doc(db, 'events', docId)).catch(() => null);
          if (!existing) {
            hadFailure = true;
            continue;
          }
          if (!existing.exists()) {
            await saveEventToFirestore(ev, authUser, { createAnnouncement: false }).catch(
              (err) => {
                hadFailure = true;
                console.warn('Event backfill skipped:', err);
              }
            );
          }
        }
      }
    }
  } catch (err) {
    hadFailure = true;
    console.warn('Local event backfill error:', err);
  }

  if (!hadFailure) {
    backfilledUsers.add(authUser.uid);
  }
}

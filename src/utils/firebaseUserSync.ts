import { Auth, User } from 'firebase/auth';
import {
  doc,
  Firestore,
  getDoc,
  getDocFromServer,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let firestoreAvailability: 'unknown' | 'available' | 'unavailable' = 'unknown';

function isPermanentFirestoreUnavailableError(error: unknown): boolean {
  const code = (error as { code?: string })?.code || '';
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    code === 'not-found' ||
    code === 'failed-precondition' ||
    code === 'unavailable' ||
    code === 'permission-denied' ||
    msg.includes('does not exist') ||
    msg.includes('client is offline') ||
    msg.includes('backend didn\'t respond')
  );
}

async function raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<{ timedOut: boolean; value: T }> {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<{ timedOut: boolean; value: T }>((resolve) => {
    timerId = setTimeout(() => resolve({ timedOut: true, value: fallback }), timeoutMs);
  });

  try {
    const result = await Promise.race([
      promise.then((value) => ({ timedOut: false, value })),
      timeoutPromise
    ]);
    return result;
  } finally {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
  }
}

export function buildFirestoreErrorInfo(
  error: unknown,
  authInstance: Auth,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: authInstance.currentUser?.uid,
      email: authInstance.currentUser?.email,
      emailVerified: authInstance.currentUser?.emailVerified,
      isAnonymous: authInstance.currentUser?.isAnonymous,
      tenantId: authInstance.currentUser?.tenantId,
      providerInfo:
        authInstance.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    }
  };
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    const { timedOut } = await raceWithTimeout(
      getDocFromServer(doc(db, 'test', 'connection')),
      2000,
      null
    );
    if (timedOut) {
      firestoreAvailability = 'unavailable';
    } else {
      firestoreAvailability = 'available';
    }
  } catch (error) {
    if (isPermanentFirestoreUnavailableError(error)) {
      firestoreAvailability = 'unavailable';
    }
  }
}

export interface SyncUserProfileInput {
  username?: string;
  fullName?: string;
  phone?: string;
  gender?: 'Male' | 'Female';
  provider?: string;
  isNewUser?: boolean;
}

/**
 * Syncs authenticated user profile data (Google OR Username/Password) to Firestore
 * without storing raw passwords. Bounded by strict timeouts and short-circuits
 * immediately when Firestore is not provisioned on the Firebase project so auth flows never hang.
 */
export async function syncUserProfileToFirestore(
  firestoreDb: Firestore,
  authInstance: Auth,
  user: User,
  extra: SyncUserProfileInput = {}
): Promise<void> {
  if (firestoreAvailability === 'unavailable') {
    return;
  }

  const providerId =
    extra.provider ||
    user.providerData?.[0]?.providerId ||
    'password';

  const cleanEmail = (user.email || '').trim().toLowerCase();
  const cleanUsername = (extra.username || '').trim().toLowerCase();
  const displayName = (extra.fullName || user.displayName || cleanUsername || cleanEmail.split('@')[0] || 'Member').trim();

  const writes: Promise<void>[] = [];

  const userPath = `users/${user.uid}`;
  writes.push(
    setDoc(
      doc(firestoreDb, 'users', user.uid),
      {
        uid: user.uid,
        email: cleanEmail,
        fullName: displayName,
        ...(cleanUsername ? { username: cleanUsername } : {}),
        ...(extra.phone ? { phone: extra.phone } : {}),
        ...(extra.gender ? { gender: extra.gender } : {}),
        photoUrl: user.photoURL || '',
        provider: providerId,
        emailVerified: Boolean(user.emailVerified),
        ...(extra.isNewUser ? { createdAt: serverTimestamp() } : {}),
        lastSignedInAt: serverTimestamp()
      },
      { merge: true }
    ).catch((error) => {
      if (isPermanentFirestoreUnavailableError(error)) {
        firestoreAvailability = 'unavailable';
      } else {
        const info = buildFirestoreErrorInfo(error, authInstance, OperationType.WRITE, userPath);
        console.warn('Firestore user profile sync skipped:', JSON.stringify(info));
      }
    })
  );

  if (cleanUsername && cleanEmail) {
    const lookupPath = `usernames/${cleanUsername}`;
    writes.push(
      setDoc(
        doc(firestoreDb, 'usernames', cleanUsername),
        {
          uid: user.uid,
          username: cleanUsername,
          email: cleanEmail,
          fullName: displayName,
          phone: extra.phone || '',
          ...(extra.gender ? { gender: extra.gender } : {}),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      ).catch((error) => {
        if (isPermanentFirestoreUnavailableError(error)) {
          firestoreAvailability = 'unavailable';
        } else {
          const info = buildFirestoreErrorInfo(error, authInstance, OperationType.WRITE, lookupPath);
          console.warn('Firestore username lookup sync skipped:', JSON.stringify(info));
        }
      })
    );
  }

  const { timedOut } = await raceWithTimeout(Promise.allSettled(writes), 1500, null);
  if (timedOut) {
    firestoreAvailability = 'unavailable';
  }
}

export async function lookupEmailByUsernameFromFirestore(
  authInstance: Auth,
  username: string
): Promise<{ email: string; username: string; fullName?: string; phone?: string; gender?: 'Male' | 'Female' } | null> {
  if (firestoreAvailability === 'unavailable') {
    return null;
  }

  const clean = username.trim().toLowerCase();
  if (!clean || clean.includes('@') || /[^a-z0-9_]/.test(clean)) {
    return null;
  }

  const lookupPath = `usernames/${clean}`;
  try {
    const { timedOut, value: snap } = await raceWithTimeout(
      getDoc(doc(db, 'usernames', clean)),
      1500,
      null
    );
    if (timedOut || !snap) {
      if (timedOut) firestoreAvailability = 'unavailable';
      return null;
    }
    firestoreAvailability = 'available';
    if (!snap.exists()) return null;
    const data = snap.data();
    if (typeof data?.email === 'string' && data.email.trim()) {
      return {
        email: data.email.trim().toLowerCase(),
        username: clean,
        fullName: typeof data.fullName === 'string' ? data.fullName : undefined,
        phone: typeof data.phone === 'string' ? data.phone : undefined,
        gender: data.gender === 'Male' || data.gender === 'Female' ? data.gender : undefined
      };
    }
  } catch (error) {
    if (isPermanentFirestoreUnavailableError(error)) {
      firestoreAvailability = 'unavailable';
    } else {
      const info = buildFirestoreErrorInfo(error, authInstance, OperationType.GET, lookupPath);
      console.warn('Firestore username lookup unavailable:', JSON.stringify(info));
    }
  }
  return null;
}

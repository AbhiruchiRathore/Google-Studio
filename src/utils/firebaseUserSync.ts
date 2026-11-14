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
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore check: client is offline or Firestore is not yet enabled.');
    }
  }
}

export interface SyncUserProfileInput {
  username?: string;
  fullName?: string;
  phone?: string;
  provider?: string;
  isNewUser?: boolean;
}

/**
 * Syncs authenticated user profile data (Google OR Username/Password) to Firestore
 * without storing raw passwords. Uses non-blocking error reporting if Firestore rules/DB aren't configured.
 */
export async function syncUserProfileToFirestore(
  firestoreDb: Firestore,
  authInstance: Auth,
  user: User,
  extra: SyncUserProfileInput = {}
): Promise<void> {
  const providerId =
    extra.provider ||
    user.providerData?.[0]?.providerId ||
    'password';

  const cleanEmail = (user.email || '').trim().toLowerCase();
  const cleanUsername = (extra.username || '').trim().toLowerCase();
  const displayName = (extra.fullName || user.displayName || cleanUsername || cleanEmail.split('@')[0] || 'Member').trim();

  const userPath = `users/${user.uid}`;
  try {
    await setDoc(
      doc(firestoreDb, 'users', user.uid),
      {
        uid: user.uid,
        email: cleanEmail,
        fullName: displayName,
        username: cleanUsername || undefined,
        phone: extra.phone || undefined,
        photoUrl: user.photoURL || '',
        provider: providerId,
        emailVerified: Boolean(user.emailVerified),
        ...(extra.isNewUser ? { createdAt: serverTimestamp() } : {}),
        lastSignedInAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    const info = buildFirestoreErrorInfo(error, authInstance, OperationType.WRITE, userPath);
    console.warn('Firestore user profile sync skipped:', JSON.stringify(info));
  }

  if (cleanUsername && cleanEmail) {
    const lookupPath = `usernames/${cleanUsername}`;
    try {
      await setDoc(
        doc(firestoreDb, 'usernames', cleanUsername),
        {
          uid: user.uid,
          username: cleanUsername,
          email: cleanEmail,
          fullName: displayName,
          phone: extra.phone || '',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, authInstance, OperationType.WRITE, lookupPath);
      console.warn('Firestore username lookup sync skipped:', JSON.stringify(info));
    }
  }
}

export async function lookupEmailByUsernameFromFirestore(
  authInstance: Auth,
  username: string
): Promise<{ email: string; username: string; fullName?: string; phone?: string } | null> {
  const clean = username.trim().toLowerCase();
  if (!clean || clean.includes('@') || /[^a-z0-9_]/.test(clean)) {
    return null;
  }

  const lookupPath = `usernames/${clean}`;
  try {
    const snap = await getDoc(doc(db, 'usernames', clean));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (typeof data?.email === 'string' && data.email.trim()) {
      return {
        email: data.email.trim().toLowerCase(),
        username: clean,
        fullName: typeof data.fullName === 'string' ? data.fullName : undefined,
        phone: typeof data.phone === 'string' ? data.phone : undefined
      };
    }
  } catch (error) {
    const info = buildFirestoreErrorInfo(error, authInstance, OperationType.GET, lookupPath);
    console.warn('Firestore username lookup unavailable:', JSON.stringify(info));
  }
  return null;
}

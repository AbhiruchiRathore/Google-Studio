import { Auth, User } from 'firebase/auth';
import {
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  authInstance: Auth = auth
): never {
  const errInfo = buildFirestoreErrorInfo(error, authInstance, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
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

const VALID_USERNAME_REGEX = /^[a-z0-9_]{3,40}$/;

function sanitizeValidUsername(raw?: string): string {
  const clean = (raw || '').trim().toLowerCase();
  return VALID_USERNAME_REGEX.test(clean) ? clean : '';
}

/**
 * Syncs authenticated user profile data (Google OR Username/Password) to Firestore
 * without storing raw passwords, matching strict create-vs-update security rules.
 */
export async function syncUserProfileToFirestore(
  firestoreDb: Firestore,
  authInstance: Auth,
  user: User,
  extra: SyncUserProfileInput = {}
): Promise<void> {
  const providerId = (
    extra.provider ||
    user.providerData?.[0]?.providerId ||
    'password'
  ).slice(0, 40);

  const cleanEmail = (user.email || '').trim().toLowerCase().slice(0, 200);
  const cleanUsername = sanitizeValidUsername(extra.username);
  const cleanPhone = (extra.phone || '').trim().slice(0, 20);
  const cleanPhotoUrl = (user.photoURL || '').trim().slice(0, 2000);
  const displayName = (
    extra.fullName ||
    user.displayName ||
    cleanUsername ||
    cleanEmail.split('@')[0] ||
    'Member'
  )
    .trim()
    .slice(0, 120);

  const userPath = `users/${user.uid}`;
  const userRef = doc(firestoreDb, 'users', user.uid);

  const writes: Promise<void>[] = [
    (async () => {
      try {
        const existingSnap = await getDoc(userRef);
        if (!existingSnap.exists() || extra.isNewUser) {
          await setDoc(userRef, {
            uid: user.uid,
            email: cleanEmail,
            fullName: displayName,
            ...(cleanUsername ? { username: cleanUsername } : {}),
            ...(cleanPhone ? { phone: cleanPhone } : {}),
            ...(extra.gender ? { gender: extra.gender } : {}),
            ...(cleanPhotoUrl ? { photoUrl: cleanPhotoUrl } : {}),
            provider: providerId,
            emailVerified: Boolean(user.emailVerified),
            createdAt: serverTimestamp(),
            lastSignedInAt: serverTimestamp()
          });
        } else {
          const existingData = existingSnap.data();
          const hasCreatedAt = Boolean(existingData?.createdAt);
          if (!hasCreatedAt) {
            await setDoc(userRef, {
              uid: user.uid,
              email: existingData?.email || cleanEmail,
              fullName: displayName,
              ...(cleanUsername ? { username: cleanUsername } : {}),
              ...(cleanPhone ? { phone: cleanPhone } : {}),
              ...(extra.gender ? { gender: extra.gender } : {}),
              ...(cleanPhotoUrl ? { photoUrl: cleanPhotoUrl } : {}),
              provider: existingData?.provider || providerId,
              emailVerified: Boolean(user.emailVerified),
              createdAt: serverTimestamp(),
              lastSignedInAt: serverTimestamp()
            });
          } else {
            await updateDoc(userRef, {
              fullName: displayName,
              ...(cleanUsername ? { username: cleanUsername } : {}),
              ...(cleanPhone ? { phone: cleanPhone } : {}),
              ...(extra.gender ? { gender: extra.gender } : {}),
              ...(cleanPhotoUrl ? { photoUrl: cleanPhotoUrl } : {}),
              emailVerified: Boolean(user.emailVerified),
              lastSignedInAt: serverTimestamp()
            });
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userPath, authInstance);
      }
    })()
  ];

  if (cleanUsername && cleanEmail.length >= 3) {
    const lookupPath = `usernames/${cleanUsername}`;
    const lookupRef = doc(firestoreDb, 'usernames', cleanUsername);
    writes.push(
      (async () => {
        try {
          const lookupSnap = await getDoc(lookupRef);
          if (!lookupSnap.exists()) {
            await setDoc(lookupRef, {
              uid: user.uid,
              username: cleanUsername,
              email: cleanEmail,
              fullName: displayName,
              ...(cleanPhone ? { phone: cleanPhone } : {}),
              ...(extra.gender ? { gender: extra.gender } : {}),
              updatedAt: serverTimestamp()
            });
          } else if (lookupSnap.data()?.uid === user.uid) {
            await updateDoc(lookupRef, {
              email: cleanEmail,
              fullName: displayName,
              ...(cleanPhone ? { phone: cleanPhone } : {}),
              ...(extra.gender ? { gender: extra.gender } : {}),
              updatedAt: serverTimestamp()
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, lookupPath, authInstance);
        }
      })()
    );
  }

  await Promise.allSettled(writes);
}

export async function lookupEmailByUsernameFromFirestore(
  authInstance: Auth,
  username: string
): Promise<{ email: string; username: string; fullName?: string; phone?: string; gender?: 'Male' | 'Female' } | null> {
  const clean = sanitizeValidUsername(username);
  if (!clean) {
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
        phone: typeof data.phone === 'string' ? data.phone : undefined,
        gender: data.gender === 'Male' || data.gender === 'Female' ? data.gender : undefined
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, lookupPath, authInstance);
  }
  return null;
}

/**
 * Deletes the authenticated user's profile and username lookup documents from Firestore.
 */
export async function deleteUserDataFromFirestore(
  firestoreDb: Firestore,
  authInstance: Auth,
  user: User,
  username?: string
): Promise<void> {
  const deletes: Promise<void>[] = [];
  const userPath = `users/${user.uid}`;
  deletes.push(
    deleteDoc(doc(firestoreDb, 'users', user.uid)).catch((error) => {
      handleFirestoreError(error, OperationType.DELETE, userPath, authInstance);
    })
  );

  const cleanUsername = sanitizeValidUsername(username);
  if (cleanUsername) {
    const lookupPath = `usernames/${cleanUsername}`;
    deletes.push(
      deleteDoc(doc(firestoreDb, 'usernames', cleanUsername)).catch((error) => {
        handleFirestoreError(error, OperationType.DELETE, lookupPath, authInstance);
      })
    );
  }

  await Promise.all(deletes);
}

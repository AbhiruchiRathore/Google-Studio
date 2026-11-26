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
import {
  AppNotification,
  AuthSession,
  ChatConversation,
  MatrimonyProfile,
  NotificationTargetTab,
  ProfileAdmirer
} from '../types';
import { buildFirestoreErrorInfo, handleFirestoreError, OperationType } from './firebaseUserSync';
import { extractReadableFirestoreError, toValidDocId } from './firestoreDirectorySync';
import { getUserStorageKey } from './profileOwnership';

const MAX_NOTIF_PHOTO_CHARS = 150_000;
const MAX_STATE_IDS = 100;

export interface NotificationReadClearState {
  readIds: string[];
  clearedIds: string[];
}

export const DEFAULT_APP_UPDATE_ANNOUNCEMENTS: AppNotification[] = [
  {
    id: 'seed_update_v2_6_notifications_chat',
    source: 'seed',
    type: 'update',
    title: 'Rathore Rishtey v2.6 — Live Chat & Real-Time Alerts',
    titleHi: 'राठौर रिश्ते v2.6 — लाइव चैट और रीयल-टाइम सूचनाएं',
    body: 'New real-time two-way family chat, live notification bell alerts for messages, profile likes, Samaj events, and smoother Android sharing are now live.',
    bodyHi: 'नया रीयल-टाइम टू-वे पारिवारिक चैट, संदेशों, प्रोफ़ाइल पसंद और समाज कार्यक्रमों की लाइव सूचना घंटी, तथा बेहतर एंड्रॉइड शेयरिंग अब उपलब्ध है।',
    read: false,
    version: 'v2.6',
    targetTab: 'matrimony',
    createdAt: '2026-06-01T10:00:00.000Z',
    createdAtMs: Date.parse('2026-06-01T10:00:00.000Z')
  }
];

function clampNotifPhoto(raw?: string): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_NOTIF_PHOTO_CHARS) return undefined;
  return trimmed;
}

function parseTimestamp(value: unknown): { iso: string; ms: number } {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return { iso: date.toISOString(), ms: date.getTime() };
    } catch {
      // fall through
    }
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return { iso: value.trim(), ms: parsed };
    }
  }
  const now = new Date();
  return { iso: now.toISOString(), ms: now.getTime() };
}

export function formatRelativeNotificationTime(ms: number, lang: 'en' | 'hi'): string {
  if (!ms || !Number.isFinite(ms)) {
    return lang === 'hi' ? 'अभी' : 'Just now';
  }
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 45) {
    return lang === 'hi' ? 'अभी' : 'Just now';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return lang === 'hi' ? `${diffMin} मिनट पहले` : `${diffMin}m ago`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return lang === 'hi' ? `${diffHours} घंटे पहले` : `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return lang === 'hi' ? `${diffDays} दिन पहले` : `${diffDays}d ago`;
  }
  const date = new Date(ms);
  return date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short'
  });
}

function getAnnouncementStateStorageKey(session: AuthSession | null): string {
  return getUserStorageKey('samaj_announcement_notif_state', session);
}

export function loadLocalAnnouncementState(session: AuthSession | null): NotificationReadClearState {
  try {
    const key = getAnnouncementStateStorageKey(session);
    const raw = localStorage.getItem(key);
    if (!raw) return { readIds: [], clearedIds: [] };
    const parsed = JSON.parse(raw) as Partial<NotificationReadClearState>;
    return {
      readIds: Array.isArray(parsed.readIds)
        ? parsed.readIds.filter((id): id is string => typeof id === 'string').slice(0, MAX_STATE_IDS)
        : [],
      clearedIds: Array.isArray(parsed.clearedIds)
        ? parsed.clearedIds.filter((id): id is string => typeof id === 'string').slice(0, MAX_STATE_IDS)
        : []
    };
  } catch {
    return { readIds: [], clearedIds: [] };
  }
}

export function saveLocalAnnouncementState(
  session: AuthSession | null,
  state: NotificationReadClearState
): void {
  try {
    const key = getAnnouncementStateStorageKey(session);
    localStorage.setItem(
      key,
      JSON.stringify({
        readIds: Array.from(new Set(state.readIds)).slice(0, MAX_STATE_IDS),
        clearedIds: Array.from(new Set(state.clearedIds)).slice(0, MAX_STATE_IDS)
      })
    );
  } catch {
    // ignore storage errors in restricted WebViews
  }
}

function isValidTargetTab(raw: unknown): raw is NotificationTargetTab {
  return (
    raw === 'matrimony' ||
    raw === 'kundali' ||
    raw === 'guest-list' ||
    raw === 'directory' ||
    raw === 'booklet' ||
    raw === 'events' ||
    raw === 'dashboard'
  );
}

function mapDocToUserNotification(docId: string, data: Record<string, unknown>): AppNotification {
  const ts = parseTimestamp(data.createdAt);
  const rawType = data.type;
  const type: AppNotification['type'] =
    rawType === 'message' || rawType === 'like' || rawType === 'event' || rawType === 'update'
      ? rawType
      : 'update';

  return {
    id: docId,
    source: 'user',
    type,
    title: typeof data.title === 'string' ? data.title : 'Notification',
    titleHi: typeof data.titleHi === 'string' ? data.titleHi : undefined,
    body: typeof data.body === 'string' ? data.body : '',
    bodyHi: typeof data.bodyHi === 'string' ? data.bodyHi : undefined,
    read: Boolean(data.read),
    createdAt: ts.iso,
    createdAtMs: ts.ms,
    actorUid: typeof data.actorUid === 'string' ? data.actorUid : undefined,
    actorName: typeof data.actorName === 'string' ? data.actorName : undefined,
    actorPhoto: typeof data.actorPhoto === 'string' ? data.actorPhoto : undefined,
    conversationId: typeof data.conversationId === 'string' ? data.conversationId : undefined,
    profileId: typeof data.profileId === 'string' ? data.profileId : undefined,
    actorProfileId: typeof data.actorProfileId === 'string' ? data.actorProfileId : undefined,
    targetTab: isValidTargetTab(data.targetTab) ? data.targetTab : undefined
  };
}

function mapDocToAnnouncementNotification(docId: string, data: Record<string, unknown>): AppNotification {
  const ts = parseTimestamp(data.createdAt);
  const type: AppNotification['type'] = data.type === 'event' ? 'event' : 'update';

  return {
    id: docId,
    source: 'announcement',
    type,
    title: typeof data.title === 'string' ? data.title : 'Samaj Update',
    titleHi: typeof data.titleHi === 'string' ? data.titleHi : undefined,
    body: typeof data.body === 'string' ? data.body : '',
    bodyHi: typeof data.bodyHi === 'string' ? data.bodyHi : undefined,
    read: false,
    createdAt: ts.iso,
    createdAtMs: ts.ms,
    version: typeof data.version === 'string' ? data.version : undefined,
    eventId: typeof data.eventId === 'string' ? data.eventId : undefined,
    eventDate: typeof data.eventDate === 'string' ? data.eventDate : undefined,
    targetTab: isValidTargetTab(data.targetTab)
      ? data.targetTab
      : type === 'event'
        ? 'events'
        : 'matrimony'
  };
}

export function subscribeUserNotifications(
  currentUid: string,
  onUpdate: (items: AppNotification[]) => void,
  onError?: (errMessage: string) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', currentUid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((snap) => {
        list.push(mapDocToUserNotification(snap.id, snap.data()));
      });
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onUpdate(list);
    },
    (error) => {
      const info = buildFirestoreErrorInfo(error, auth, OperationType.LIST, 'notifications');
      console.error('Firestore Error: ', JSON.stringify(info));
      onError?.(extractReadableFirestoreError(error));
    }
  );
}

export function subscribeGlobalAnnouncements(
  onUpdate: (items: AppNotification[]) => void,
  onError?: (errMessage: string) => void
): Unsubscribe {
  const q = query(
    collection(db, 'announcements'),
    where('status', '==', 'active')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((snap) => {
        list.push(mapDocToAnnouncementNotification(snap.id, snap.data()));
      });
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onUpdate(list);
    },
    (error) => {
      const info = buildFirestoreErrorInfo(error, auth, OperationType.LIST, 'announcements');
      console.error('Firestore Error: ', JSON.stringify(info));
      onError?.(extractReadableFirestoreError(error));
    }
  );
}

export function subscribeUserAnnouncementState(
  currentUid: string,
  onUpdate: (state: NotificationReadClearState) => void
): Unsubscribe {
  const ref = doc(db, 'users', currentUid, 'notificationState', 'global');
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onUpdate({ readIds: [], clearedIds: [] });
        return;
      }
      const data = snap.data();
      onUpdate({
        readIds: Array.isArray(data.readIds)
          ? data.readIds.filter((id): id is string => typeof id === 'string').slice(0, MAX_STATE_IDS)
          : [],
        clearedIds: Array.isArray(data.clearedIds)
          ? data.clearedIds.filter((id): id is string => typeof id === 'string').slice(0, MAX_STATE_IDS)
          : []
      });
    },
    (error) => {
      const info = buildFirestoreErrorInfo(
        error,
        auth,
        OperationType.GET,
        `users/${currentUid}/notificationState/global`
      );
      console.error('Firestore Error: ', JSON.stringify(info));
    }
  );
}

async function persistAnnouncementStateToFirestore(
  currentUid: string,
  nextState: NotificationReadClearState
): Promise<void> {
  const cleanReadIds = Array.from(new Set(nextState.readIds))
    .map((id) => toValidDocId(id))
    .slice(0, MAX_STATE_IDS);
  const cleanClearedIds = Array.from(new Set(nextState.clearedIds))
    .map((id) => toValidDocId(id))
    .slice(0, MAX_STATE_IDS);

  try {
    await setDoc(doc(db, 'users', currentUid, 'notificationState', 'global'), {
      uid: currentUid,
      readIds: cleanReadIds,
      clearedIds: cleanClearedIds,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    const info = buildFirestoreErrorInfo(
      error,
      auth,
      OperationType.WRITE,
      `users/${currentUid}/notificationState/global`
    );
    console.error('Firestore Error: ', JSON.stringify(info));
  }
}

export async function markNotificationAsRead(
  notification: AppNotification,
  authUser: User | null,
  authSession: AuthSession | null,
  currentAnnouncementState: NotificationReadClearState,
  setLocalAnnouncementState: (next: NotificationReadClearState) => void
): Promise<void> {
  if (notification.read) return;

  if (notification.source === 'user' && authUser?.uid) {
    try {
      await updateDoc(doc(db, 'notifications', notification.id), {
        read: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      const info = buildFirestoreErrorInfo(
        error,
        auth,
        OperationType.UPDATE,
        `notifications/${notification.id}`
      );
      console.error('Firestore Error: ', JSON.stringify(info));
    }
    return;
  }

  const nextState: NotificationReadClearState = {
    readIds: Array.from(new Set([notification.id, ...currentAnnouncementState.readIds])).slice(0, MAX_STATE_IDS),
    clearedIds: currentAnnouncementState.clearedIds
  };
  setLocalAnnouncementState(nextState);
  saveLocalAnnouncementState(authSession, nextState);

  if (authUser?.uid) {
    await persistAnnouncementStateToFirestore(authUser.uid, nextState);
  }
}

export async function markAllNotificationsAsRead(
  notifications: AppNotification[],
  authUser: User | null,
  authSession: AuthSession | null,
  currentAnnouncementState: NotificationReadClearState,
  setLocalAnnouncementState: (next: NotificationReadClearState) => void
): Promise<void> {
  const unreadUser = notifications.filter((n) => n.source === 'user' && !n.read);
  const unreadAnnouncementIds = notifications
    .filter((n) => n.source !== 'user' && !n.read)
    .map((n) => n.id);

  if (unreadUser.length > 0 && authUser?.uid) {
    try {
      const batch = writeBatch(db);
      for (const item of unreadUser.slice(0, 100)) {
        batch.update(doc(db, 'notifications', item.id), {
          read: true,
          updatedAt: serverTimestamp()
        });
      }
      await batch.commit();
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, auth, OperationType.UPDATE, 'notifications');
      console.error('Firestore Error: ', JSON.stringify(info));
    }
  }

  if (unreadAnnouncementIds.length > 0) {
    const nextState: NotificationReadClearState = {
      readIds: Array.from(
        new Set([...unreadAnnouncementIds, ...currentAnnouncementState.readIds])
      ).slice(0, MAX_STATE_IDS),
      clearedIds: currentAnnouncementState.clearedIds
    };
    setLocalAnnouncementState(nextState);
    saveLocalAnnouncementState(authSession, nextState);

    if (authUser?.uid) {
      await persistAnnouncementStateToFirestore(authUser.uid, nextState);
    }
  }
}

export async function clearReadNotifications(
  notifications: AppNotification[],
  authUser: User | null,
  authSession: AuthSession | null,
  currentAnnouncementState: NotificationReadClearState,
  setLocalAnnouncementState: (next: NotificationReadClearState) => void
): Promise<void> {
  const readUser = notifications.filter((n) => n.source === 'user' && n.read);
  const readAnnouncementIds = notifications
    .filter((n) => n.source !== 'user' && n.read)
    .map((n) => n.id);

  if (readUser.length > 0 && authUser?.uid) {
    try {
      const batch = writeBatch(db);
      for (const item of readUser.slice(0, 100)) {
        batch.delete(doc(db, 'notifications', item.id));
      }
      await batch.commit();
    } catch (error) {
      const info = buildFirestoreErrorInfo(error, auth, OperationType.DELETE, 'notifications');
      console.error('Firestore Error: ', JSON.stringify(info));
    }
  }

  if (readAnnouncementIds.length > 0) {
    const nextState: NotificationReadClearState = {
      readIds: currentAnnouncementState.readIds,
      clearedIds: Array.from(
        new Set([...readAnnouncementIds, ...currentAnnouncementState.clearedIds])
      ).slice(0, MAX_STATE_IDS)
    };
    setLocalAnnouncementState(nextState);
    saveLocalAnnouncementState(authSession, nextState);

    if (authUser?.uid) {
      await persistAnnouncementStateToFirestore(authUser.uid, nextState);
    }
  }
}

export interface RecordProfileLikeParams {
  targetProfile: MatrimonyProfile;
  authUser: User;
  authSession: AuthSession | null;
  likerProfile?: MatrimonyProfile | null;
}

export async function recordProfileLikeAndNotify(
  params: RecordProfileLikeParams
): Promise<void> {
  const recipientUid = (params.targetProfile.ownerUid || '').trim();
  const profileId = toValidDocId(params.targetProfile.id);
  const actorUid = params.authUser.uid;

  // Skip cloud write for legacy mock profiles without an ownerUid or self-likes
  if (!recipientUid || recipientUid === actorUid) {
    return;
  }

  const actorName = (
    params.likerProfile?.name ||
    params.authSession?.name ||
    params.authUser.displayName ||
    params.authSession?.username ||
    'Samaj Member'
  )
    .trim()
    .slice(0, 120) || 'Samaj Member';

  const actorPhoto = clampNotifPhoto(
    params.likerProfile?.photo || params.authSession?.photoUrl || params.authUser.photoURL || undefined
  );
  const likerProfileId = params.likerProfile ? toValidDocId(params.likerProfile.id) : undefined;
  const notifId = `notif_like_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const likeRef = doc(db, 'profiles', profileId, 'likes', actorUid);
  const notifRef = doc(db, 'notifications', notifId);

  try {
    const existingLike = await getDoc(likeRef);
    const batch = writeBatch(db);

    if (!existingLike.exists()) {
      const likePayload: Record<string, unknown> = {
        likerUid: actorUid,
        likerName: actorName,
        profileId,
        profileOwnerUid: recipientUid,
        createdAt: serverTimestamp()
      };
      if (params.likerProfile?.city) likePayload.likerCity = params.likerProfile.city.trim().slice(0, 100);
      if (params.likerProfile?.gotra) likePayload.likerGotra = params.likerProfile.gotra.trim().slice(0, 80);
      if (likerProfileId) likePayload.likerProfileId = likerProfileId;
      if (actorPhoto) likePayload.likerPhoto = actorPhoto;

      batch.set(likeRef, likePayload);
    }

    batch.set(notifRef, {
      id: notifId,
      recipientUid,
      actorUid,
      actorName,
      ...(actorPhoto ? { actorPhoto } : {}),
      type: 'like',
      title: 'Profile Liked',
      titleHi: 'प्रोफ़ाइल पसंद की गई',
      body: `${actorName} liked your profile (${params.targetProfile.name})`,
      bodyHi: `${actorName} ने आपकी प्रोफ़ाइल (${params.targetProfile.name}) पसंद की है`,
      read: false,
      profileId,
      ...(likerProfileId ? { actorProfileId: likerProfileId } : {}),
      targetTab: 'dashboard',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    const info = buildFirestoreErrorInfo(
      error,
      auth,
      OperationType.WRITE,
      `profiles/${profileId}/likes/${actorUid}`
    );
    console.error('Firestore Error: ', JSON.stringify(info));
  }
}

export async function removeProfileLikeRecord(
  profileId: number | string,
  authUser: User | null
): Promise<void> {
  if (!authUser?.uid) return;
  const docId = toValidDocId(profileId);
  try {
    await deleteDoc(doc(db, 'profiles', docId, 'likes', authUser.uid));
  } catch (error) {
    const info = buildFirestoreErrorInfo(
      error,
      auth,
      OperationType.DELETE,
      `profiles/${docId}/likes/${authUser.uid}`
    );
    console.error('Firestore Error: ', JSON.stringify(info));
  }
}

export function subscribeProfileLikesForOwner(
  profileId: number | string,
  ownerUid: string,
  onUpdate: (admirers: ProfileAdmirer[]) => void
): Unsubscribe {
  const docId = toValidDocId(profileId);
  const q = query(
    collection(db, 'profiles', docId, 'likes'),
    where('profileOwnerUid', '==', ownerUid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ProfileAdmirer[] = [];
      snapshot.forEach((snap) => {
        const data = snap.data();
        const ts = parseTimestamp(data.createdAt);
        list.push({
          id: typeof data.likerProfileId === 'string' && data.likerProfileId
            ? data.likerProfileId
            : snap.id,
          admirerProfileId: typeof data.likerProfileId === 'string' ? data.likerProfileId : undefined,
          admirerName: typeof data.likerName === 'string' ? data.likerName : 'Samaj Member',
          admirerGotra: typeof data.likerGotra === 'string' ? data.likerGotra : 'Rathore',
          admirerCity: typeof data.likerCity === 'string' ? data.likerCity : 'Indore',
          admirerAge: 26,
          admirerEducation: 'Samaj Member',
          admirerPhoto: typeof data.likerPhoto === 'string' ? data.likerPhoto : undefined,
          admirerPhone: '',
          likedAt: new Date(ts.ms).toLocaleDateString([], { day: 'numeric', month: 'short' })
        });
      });
      onUpdate(list);
    },
    (error) => {
      const info = buildFirestoreErrorInfo(
        error,
        auth,
        OperationType.LIST,
        `profiles/${docId}/likes`
      );
      console.error('Firestore Error: ', JSON.stringify(info));
    }
  );
}

export interface PublishAppUpdateParams {
  title: string;
  titleHi?: string;
  body: string;
  bodyHi?: string;
  version?: string;
  targetTab?: NotificationTargetTab;
  authUser: User;
  authorName?: string;
}

export async function publishAppUpdateAnnouncement(
  params: PublishAppUpdateParams
): Promise<{ ok: boolean; error?: string }> {
  const cleanTitle = params.title.trim().slice(0, 160);
  const cleanBody = params.body.trim().slice(0, 1000);
  if (!cleanTitle || !cleanBody) {
    return { ok: false, error: 'Title and message are required.' };
  }

  const annId = `ann_upd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const payload: Record<string, unknown> = {
    id: annId,
    type: 'update',
    title: cleanTitle,
    body: cleanBody,
    authorUid: params.authUser.uid,
    status: 'active',
    targetTab: params.targetTab || 'matrimony',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (params.titleHi?.trim()) payload.titleHi = params.titleHi.trim().slice(0, 200);
  if (params.bodyHi?.trim()) payload.bodyHi = params.bodyHi.trim().slice(0, 1200);
  if (params.version?.trim()) payload.version = params.version.trim().slice(0, 40);
  if (params.authorName?.trim()) payload.authorName = params.authorName.trim().slice(0, 120);

  try {
    await setDoc(doc(db, 'announcements', annId), payload);
    return { ok: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, `announcements/${annId}`, auth);
    } catch (wrapped) {
      return { ok: false, error: extractReadableFirestoreError(wrapped) };
    }
    return { ok: false, error: 'Could not publish app update.' };
  }
}

export async function fetchConversationById(
  conversationId: string
): Promise<ChatConversation | null> {
  try {
    const snap = await getDoc(doc(db, 'conversations', conversationId));
    if (!snap.exists()) return null;
    const data = snap.data();
    const participantIds = Array.isArray(data.participantIds)
      ? data.participantIds.filter((id): id is string => typeof id === 'string')
      : [];
    const participantNames = (data.participantNames as Record<string, string>) || {};
    const participantPhotos = (data.participantPhotos as Record<string, string>) || undefined;

    return {
      id: snap.id,
      participantIds,
      participantNames,
      participantPhotos,
      profileId: typeof data.profileId === 'string' ? data.profileId : undefined,
      profileName: typeof data.profileName === 'string' ? data.profileName : undefined,
      profileGotra: typeof data.profileGotra === 'string' ? data.profileGotra : undefined,
      profileCity: typeof data.profileCity === 'string' ? data.profileCity : undefined,
      profilePhoto: typeof data.profilePhoto === 'string' ? data.profilePhoto : undefined,
      lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : undefined,
      lastMessageSenderId: typeof data.lastMessageSenderId === 'string' ? data.lastMessageSenderId : undefined,
      lastMessageSenderName: typeof data.lastMessageSenderName === 'string' ? data.lastMessageSenderName : undefined
    };
  } catch (error) {
    const info = buildFirestoreErrorInfo(
      error,
      auth,
      OperationType.GET,
      `conversations/${conversationId}`
    );
    console.error('Firestore Error: ', JSON.stringify(info));
    return null;
  }
}

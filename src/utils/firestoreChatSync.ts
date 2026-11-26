import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  Unsubscribe,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AuthSession, ChatConversation, ChatMessage, MatrimonyProfile } from '../types';
import { buildFirestoreErrorInfo, handleFirestoreError, OperationType } from './firebaseUserSync';
import { extractReadableFirestoreError, toValidDocId } from './firestoreDirectorySync';

const MAX_CHAT_TEXT_CHARS = 2000;
const MAX_CHAT_PHOTO_CHARS = 150_000;

export function buildSortedParticipantPair(uidA: string, uidB: string): [string, string] {
  const cleanA = uidA.trim();
  const cleanB = uidB.trim();
  return cleanA < cleanB ? [cleanA, cleanB] : [cleanB, cleanA];
}

export function buildConversationId(uidA: string, uidB: string): string {
  const [first, second] = buildSortedParticipantPair(uidA, uidB);
  return `${first}__${second}`;
}

export function resolveCurrentUserDisplayName(
  authSession: AuthSession | null,
  firebaseUser: User | null
): string {
  const candidate =
    authSession?.name ||
    firebaseUser?.displayName ||
    authSession?.username ||
    (firebaseUser?.email ? firebaseUser.email.split('@')[0] : '') ||
    (authSession?.email ? authSession.email.split('@')[0] : '') ||
    'Samaj Member';
  return candidate.trim().slice(0, 120) || 'Samaj Member';
}

function clampChatPhoto(raw?: string): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_CHAT_PHOTO_CHARS) return undefined;
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

export function formatChatTimestamp(isoOrMs: string | number | undefined, pending = false): string {
  if (pending) {
    return '...';
  }
  const date =
    typeof isoOrMs === 'number'
      ? new Date(isoOrMs)
      : isoOrMs
        ? new Date(isoOrMs)
        : new Date();
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isSameDay) {
    return timePart;
  }
  const datePart = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return `${datePart}, ${timePart}`;
}

function mapDocToConversation(docId: string, data: Record<string, unknown>): ChatConversation {
  const participantIds = Array.isArray(data.participantIds)
    ? data.participantIds.filter((id): id is string => typeof id === 'string')
    : [];

  const namesRaw = (data.participantNames as Record<string, unknown>) || {};
  const participantNames: Record<string, string> = {};
  for (const uid of participantIds) {
    if (typeof namesRaw[uid] === 'string' && namesRaw[uid].trim()) {
      participantNames[uid] = (namesRaw[uid] as string).trim();
    }
  }

  const photosRaw = (data.participantPhotos as Record<string, unknown>) || {};
  const participantPhotos: Record<string, string> = {};
  for (const uid of participantIds) {
    if (typeof photosRaw[uid] === 'string' && (photosRaw[uid] as string).trim()) {
      participantPhotos[uid] = (photosRaw[uid] as string).trim();
    }
  }

  const unreadBy = Array.isArray(data.unreadBy)
    ? data.unreadBy.filter((id): id is string => typeof id === 'string')
    : [];

  const lastAt = data.lastMessageAt ? parseTimestamp(data.lastMessageAt) : undefined;
  const created = data.createdAt ? parseTimestamp(data.createdAt) : undefined;
  const updated = data.updatedAt ? parseTimestamp(data.updatedAt) : undefined;

  return {
    id: docId,
    participantIds,
    participantNames,
    participantPhotos: Object.keys(participantPhotos).length > 0 ? participantPhotos : undefined,
    profileId: typeof data.profileId === 'string' ? data.profileId : undefined,
    profileName: typeof data.profileName === 'string' ? data.profileName : undefined,
    profileGotra: typeof data.profileGotra === 'string' ? data.profileGotra : undefined,
    profileCity: typeof data.profileCity === 'string' ? data.profileCity : undefined,
    profilePhoto: typeof data.profilePhoto === 'string' ? data.profilePhoto : undefined,
    lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : undefined,
    lastMessageSenderId: typeof data.lastMessageSenderId === 'string' ? data.lastMessageSenderId : undefined,
    lastMessageSenderName: typeof data.lastMessageSenderName === 'string' ? data.lastMessageSenderName : undefined,
    lastMessageAt: lastAt?.iso,
    lastMessageAtMs: lastAt?.ms ?? updated?.ms ?? created?.ms ?? 0,
    unreadBy,
    createdAt: created?.iso,
    updatedAt: updated?.iso
  };
}

function mapDocToChatMessage(
  docId: string,
  conversationId: string,
  data: Record<string, unknown>,
  hasPendingWrites: boolean,
  currentUid: string
): ChatMessage {
  const hasServerTimestamp = Boolean(
    data.createdAt &&
      typeof data.createdAt === 'object' &&
      'toDate' in (data.createdAt as Record<string, unknown>)
  );
  const parsedTime = hasServerTimestamp
    ? parseTimestamp(data.createdAt)
    : { iso: new Date().toISOString(), ms: Date.now() };

  const readBy = Array.isArray(data.readBy)
    ? data.readBy.filter((id): id is string => typeof id === 'string')
    : [];

  const senderId = typeof data.senderId === 'string' ? data.senderId : '';
  const isReadByRecipient = readBy.some((uid) => uid !== senderId);

  return {
    id: docId,
    conversationId,
    profileId: typeof data.profileId === 'string' ? data.profileId : undefined,
    senderId,
    senderName: typeof data.senderName === 'string' ? data.senderName : 'Member',
    text: typeof data.text === 'string' ? data.text : '',
    createdAt: parsedTime.iso,
    createdAtMs: parsedTime.ms,
    timestamp: formatChatTimestamp(parsedTime.ms, hasPendingWrites && !hasServerTimestamp),
    readBy,
    status:
      senderId === currentUid
        ? hasPendingWrites && !hasServerTimestamp
          ? 'sending'
          : isReadByRecipient
            ? 'read'
            : 'sent'
        : 'read'
  };
}

export function subscribeUserConversations(
  currentUid: string,
  onUpdate: (conversations: ChatConversation[]) => void,
  onError?: (readableError: string) => void
): Unsubscribe {
  const path = 'conversations';
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', currentUid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ChatConversation[] = [];
      snapshot.forEach((snap) => {
        list.push(mapDocToConversation(snap.id, snap.data()));
      });
      list.sort((a, b) => (b.lastMessageAtMs || 0) - (a.lastMessageAtMs || 0));
      onUpdate(list);
    },
    (error) => {
      const info = buildFirestoreErrorInfo(error, auth, OperationType.LIST, path);
      console.error('Firestore Error: ', JSON.stringify(info));
      if (onError) {
        onError(extractReadableFirestoreError(error));
      }
    }
  );
}

export function subscribeConversationMessages(
  conversationId: string,
  currentUid: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (readableError: string) => void
): Unsubscribe {
  const path = `conversations/${conversationId}/messages`;
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    where('participantIds', 'array-contains', currentUid)
  );

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((snap) => {
        list.push(
          mapDocToChatMessage(
            snap.id,
            conversationId,
            snap.data(),
            snap.metadata.hasPendingWrites,
            currentUid
          )
        );
      });
      list.sort((a, b) => {
        const diff = (a.createdAtMs || 0) - (b.createdAtMs || 0);
        if (diff !== 0) return diff;
        return a.id.localeCompare(b.id);
      });
      onUpdate(list);
    },
    (error) => {
      const info = buildFirestoreErrorInfo(error, auth, OperationType.LIST, path);
      console.error('Firestore Error: ', JSON.stringify(info));
      if (onError) {
        onError(extractReadableFirestoreError(error));
      }
    }
  );
}

export interface SendChatMessageParams {
  senderUser: User;
  senderName: string;
  senderPhoto?: string;
  recipientUid: string;
  recipientName: string;
  recipientPhoto?: string;
  text: string;
  profile?: MatrimonyProfile | null;
}

export async function sendRealChatMessage(params: SendChatMessageParams): Promise<void> {
  const cleanText = params.text.trim().slice(0, MAX_CHAT_TEXT_CHARS);
  if (!cleanText) {
    throw new Error('Cannot send an empty message.');
  }

  const senderUid = params.senderUser.uid;
  const recipientUid = params.recipientUid.trim();
  if (!senderUid || !recipientUid || senderUid === recipientUid) {
    throw new Error('Both sender and recipient must be valid distinct users.');
  }

  const participantIds = buildSortedParticipantPair(senderUid, recipientUid);
  const conversationId = buildConversationId(senderUid, recipientUid);
  const cleanSenderName = (params.senderName || 'Samaj Member').trim().slice(0, 120) || 'Samaj Member';
  const cleanRecipientName = (params.recipientName || 'Samaj Family').trim().slice(0, 120) || 'Samaj Family';

  const participantNames: Record<string, string> = {
    [senderUid]: cleanSenderName,
    [recipientUid]: cleanRecipientName
  };

  const participantPhotos: Record<string, string> = {};
  const sPhoto = clampChatPhoto(params.senderPhoto);
  const rPhoto = clampChatPhoto(params.recipientPhoto || params.profile?.photo);
  if (sPhoto) participantPhotos[senderUid] = sPhoto;
  if (rPhoto) participantPhotos[recipientUid] = rPhoto;

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const convRef = doc(db, 'conversations', conversationId);
  const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);

  const profileId = params.profile ? toValidDocId(params.profile.id) : undefined;
  const profileName = params.profile?.name?.trim().slice(0, 120);
  const profileGotra = params.profile?.gotra?.trim().slice(0, 80);
  const profileCity = params.profile?.city?.trim().slice(0, 100);
  const profilePhoto = clampChatPhoto(params.profile?.photo);

  try {
    const existingConv = await getDoc(convRef);
    const batch = writeBatch(db);

    const convFields: Record<string, unknown> = {
      participantNames,
      lastMessage: cleanText,
      lastMessageSenderId: senderUid,
      lastMessageSenderName: cleanSenderName,
      lastMessageAt: serverTimestamp(),
      unreadBy: [recipientUid],
      updatedAt: serverTimestamp()
    };

    if (Object.keys(participantPhotos).length > 0) {
      convFields.participantPhotos = participantPhotos;
    }
    if (profileId) convFields.profileId = profileId;
    if (profileName) convFields.profileName = profileName;
    if (profileGotra) convFields.profileGotra = profileGotra;
    if (profileCity) convFields.profileCity = profileCity;
    if (profilePhoto) convFields.profilePhoto = profilePhoto;

    if (!existingConv.exists()) {
      batch.set(convRef, {
        id: conversationId,
        participantIds,
        ...convFields,
        createdAt: serverTimestamp()
      });
    } else {
      batch.update(convRef, convFields);
    }

    batch.set(msgRef, {
      id: messageId,
      conversationId,
      participantIds,
      senderId: senderUid,
      senderName: cleanSenderName,
      text: cleanText,
      ...(profileId ? { profileId } : {}),
      readBy: [senderUid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const notifId = `notif_msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const snippet = cleanText.length > 90 ? `${cleanText.slice(0, 87)}...` : cleanText;
    const notifBody = `${cleanSenderName} sent you a message: "${snippet}"`.slice(0, 500);
    const notifBodyHi = `${cleanSenderName} ने आपको संदेश भेजा है: "${snippet}"`.slice(0, 600);

    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      recipientUid,
      actorUid: senderUid,
      actorName: cleanSenderName,
      ...(sPhoto ? { actorPhoto: sPhoto } : {}),
      type: 'message',
      title: `${cleanSenderName} sent you a message`.slice(0, 160),
      titleHi: `${cleanSenderName} ने आपको संदेश भेजा है`.slice(0, 200),
      body: notifBody,
      bodyHi: notifBodyHi,
      read: false,
      conversationId,
      ...(profileId ? { profileId } : {}),
      targetTab: 'dashboard',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `conversations/${conversationId}/messages/${messageId}`, auth);
  }
}

export async function markConversationMessagesAsRead(
  conversationId: string,
  currentUid: string,
  messages: ChatMessage[],
  shouldClearConvUnread: boolean
): Promise<void> {
  const unreadIncoming = messages.filter(
    (msg) =>
      msg.senderId !== currentUid &&
      !(msg.readBy || []).includes(currentUid)
  );

  if (unreadIncoming.length === 0 && !shouldClearConvUnread) {
    return;
  }

  try {
    const batch = writeBatch(db);

    for (const msg of unreadIncoming.slice(0, 40)) {
      const nextReadBy = Array.from(new Set([...(msg.readBy || [msg.senderId]), currentUid])).slice(0, 2);
      batch.update(doc(db, 'conversations', conversationId, 'messages', msg.id), {
        readBy: nextReadBy,
        updatedAt: serverTimestamp()
      });
    }

    if (shouldClearConvUnread) {
      batch.update(doc(db, 'conversations', conversationId), {
        unreadBy: [],
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
  } catch (error) {
    // Log structured error cleanly without crashing active UI
    const info = buildFirestoreErrorInfo(
      error,
      auth,
      OperationType.UPDATE,
      `conversations/${conversationId}`
    );
    console.error('Firestore Error: ', JSON.stringify(info));
  }
}

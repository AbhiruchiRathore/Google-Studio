import React, { useState, useEffect, useRef } from 'react';
import {
  X, Send, Phone, ShieldCheck, Sparkles,
  Check, CheckCheck, Clock, Ban, ShieldAlert,
  Loader2, AlertCircle, LogIn, MessageCircle
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { MatrimonyProfile, ChatMessage, ChatConversation, AuthSession } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  buildConversationId,
  markConversationMessagesAsRead,
  resolveCurrentUserDisplayName,
  sendRealChatMessage,
  subscribeConversationMessages
} from '../utils/firestoreChatSync';

interface ChatModalProps {
  profile?: MatrimonyProfile | null;
  conversation?: ChatConversation | null;
  authSession: AuthSession | null;
  onClose: () => void;
  onSelectKundaliProfile?: (id: number | string, gender: 'Male' | 'Female') => void;
  onNavigateToSignIn?: () => void;
  onOpenInbox?: () => void;
  isBlocked?: boolean;
  onBlockProfile?: (profile: MatrimonyProfile) => void;
  onUnblockProfile?: (id: number | string) => void;
}

const QUICK_PROMPTS_EN = [
  'Jai Mataji Ki! We saw your biodata and would like to connect.',
  "Greetings! Can we speak with the candidate's parents regarding Gotra?",
  "Kindly share your family's astrological Kundali / Patrika details.",
  "We are also from the same region. Let's exchange family contact numbers."
];

const QUICK_PROMPTS_HI = [
  'जय माताजी की! हमने आपका बायोडाटा देखा और हम जुड़ना चाहते हैं।',
  'नमस्ते! क्या हम गोत्र एवं रिश्ते के बारे में माता-पिता से बात कर सकते हैं?',
  'कृपया अपने परिवार की जन्मपत्रिका / कुंडली विवरण साझा करें।',
  'हम भी उसी क्षेत्र से हैं। आइए परिवार के संपर्क नंबर साझा करें।'
];

export const ChatModal: React.FC<ChatModalProps> = ({
  profile = null,
  conversation = null,
  authSession,
  onClose,
  onSelectKundaliProfile,
  onNavigateToSignIn,
  onOpenInbox,
  isBlocked = false,
  onBlockProfile,
  onUnblockProfile
}) => {
  const { lang, t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const [inputMessage, setInputMessage] = useState('');
  const [confirmBlock, setConfirmBlock] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  const currentUid = firebaseUser?.uid || null;

  // Identify the other participant cleanly from either conversation or profile.ownerUid
  const otherUid = React.useMemo(() => {
    if (conversation && currentUid) {
      const other = conversation.participantIds.find((id) => id !== currentUid);
      if (other) return other;
    }
    if (profile?.ownerUid && profile.ownerUid.trim()) {
      return profile.ownerUid.trim();
    }
    return null;
  }, [conversation, currentUid, profile?.ownerUid]);

  const isOwnProfileChat = Boolean(
    currentUid && profile?.ownerUid && profile.ownerUid === currentUid && !conversation
  );

  const conversationId = React.useMemo(() => {
    if (conversation?.id) return conversation.id;
    if (currentUid && otherUid && currentUid !== otherUid) {
      return buildConversationId(currentUid, otherUid);
    }
    return null;
  }, [conversation?.id, currentUid, otherUid]);

  const quickPrompts = lang === 'hi' ? QUICK_PROMPTS_HI : QUICK_PROMPTS_EN;

  const displayName =
    (otherUid && conversation?.participantNames?.[otherUid]) ||
    profile?.name ||
    conversation?.profileName ||
    profile?.ownerName ||
    t('Samaj Family', 'समाज परिवार');

  const subtitleDetails = profile
    ? `${t('Gotra:', 'गोत्र:')} ${profile.gotra} · ${profile.city} · ${profile.age} ${t('Yrs', 'वर्ष')}`
    : conversation?.profileName
      ? [
          conversation.profileName,
          conversation.profileGotra ? `${t('Gotra:', 'गोत्र:')} ${conversation.profileGotra}` : '',
          conversation.profileCity || ''
        ]
          .filter(Boolean)
          .join(' · ')
      : t('Verified Samaj Member Conversation', 'सत्यापित समाज सदस्य संवाद');

  const fallbackPhoto =
    profile?.gender === 'Female'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';

  const photoUrl =
    (profile?.photo && profile.photo.trim() !== '' ? profile.photo : '') ||
    (otherUid && conversation?.participantPhotos?.[otherUid]) ||
    conversation?.profilePhoto ||
    fallbackPhoto;

  const firstPhone = profile?.contact ? profile.contact.split(',')[0].trim() : '';

  const canChatLive = Boolean(currentUid && otherUid && currentUid !== otherUid && conversationId && !isOwnProfileChat);

  // Real-time Firestore messages subscription
  useEffect(() => {
    if (!canChatLive || !conversationId || !currentUid) {
      setMessages([]);
      setIsLoadingMessages(false);
      setLoadError(null);
      return;
    }

    setIsLoadingMessages(true);
    setLoadError(null);

    const unsubscribe = subscribeConversationMessages(
      conversationId,
      currentUid,
      (incomingMessages) => {
        setMessages(incomingMessages);
        setIsLoadingMessages(false);
        setLoadError(null);
      },
      (errMessage) => {
        setLoadError(
          errMessage ||
            t(
              'Unable to load messages right now. Please check your connection and try again.',
              'अभी संदेश लोड नहीं हो सके। कृपया इंटरनेट जांचें और पुनः प्रयास करें।'
            )
        );
        setIsLoadingMessages(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [canChatLive, conversationId, currentUid, retryNonce, t]);

  // Mark incoming unread messages & conversation unread flag as read when viewed
  useEffect(() => {
    if (!canChatLive || !conversationId || !currentUid || isBlocked) return;

    const hasUnreadIncoming = messages.some(
      (msg) => msg.senderId !== currentUid && !(msg.readBy || []).includes(currentUid)
    );
    const convUnreadForMe = Boolean(conversation?.unreadBy?.includes(currentUid));

    if (hasUnreadIncoming || convUnreadForMe) {
      void markConversationMessagesAsRead(
        conversationId,
        currentUid,
        messages,
        convUnreadForMe
      );
    }
  }, [canChatLive, conversationId, currentUid, messages, conversation?.unreadBy, isBlocked]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = typeof textToSend === 'string' ? textToSend : inputMessage;
    const trimmed = rawText.trim();
    if (!trimmed || isSending || !canChatLive || !firebaseUser || !otherUid || isBlocked) {
      return;
    }

    setSendError(null);
    setIsSending(true);
    const isUsingComposer = typeof textToSend !== 'string';
    if (isUsingComposer) {
      setInputMessage('');
    }

    try {
      const senderName = resolveCurrentUserDisplayName(authSession, firebaseUser);
      const senderPhoto = authSession?.photoUrl || firebaseUser.photoURL || undefined;
      const recipientName =
        (otherUid && conversation?.participantNames?.[otherUid]) ||
        profile?.ownerName ||
        profile?.name ||
        conversation?.profileName ||
        'Samaj Family';
      const recipientPhoto =
        (otherUid && conversation?.participantPhotos?.[otherUid]) ||
        profile?.photo ||
        conversation?.profilePhoto ||
        undefined;

      await sendRealChatMessage({
        senderUser: firebaseUser,
        senderName,
        senderPhoto,
        recipientUid: otherUid,
        recipientName,
        recipientPhoto,
        text: trimmed,
        profile
      });
    } catch (error) {
      if (isUsingComposer) {
        setInputMessage(rawText);
      }
      console.error('Failed to send live message:', error);
      setSendError(
        t(
          'Failed to send message. Please check your connection and try again.',
          'संदेश नहीं भेजा जा सका। कृपया अपना इंटरनेट जांचें और पुनः प्रयास करें।'
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center px-2.5 sm:px-4 pt-[calc(0.75rem+var(--sat))] pb-[calc(0.75rem+var(--sab))] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-amber-300 flex flex-col h-[min(86dvh,640px)] max-h-[calc(100dvh-1.5rem-var(--sat)-var(--sab))] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CHAT HEADER */}
        <div className="bg-gradient-to-r from-[#380812] via-[#540e1b] to-[#380812] text-white p-3.5 sm:p-4 flex items-center justify-between gap-2 border-b border-amber-500/30 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <img
                src={photoUrl}
                alt={displayName}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover object-top border-2 border-amber-300 shadow-sm"
              />
              {canChatLive && (
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#380812] rounded-full"
                  title={t('Live Real-Time Sync', 'लाइव रियल-टाइम सिंक')}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-serif font-bold text-sm sm:text-base text-amber-50 leading-tight truncate">
                  {displayName}
                </h3>
                <ShieldCheck className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0" />
              </div>
              <p className="text-[11px] text-amber-200/80 font-medium truncate">
                {subtitleDetails}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {firstPhone && !isBlocked && (
              <a
                href={`tel:${firstPhone}`}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 transition-colors"
                title={t(`Call ${displayName} (${firstPhone})`, `${displayName} को कॉल करें (${firstPhone})`)}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}

            {profile && authSession && onBlockProfile && !isBlocked && !isOwnProfileChat && (
              <button
                type="button"
                onClick={() => setConfirmBlock((prev) => !prev)}
                className={`px-2.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                  confirmBlock
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/10 hover:bg-rose-600/80 text-rose-200 hover:text-white'
                }`}
                title={t(`Block ${profile.name}`, `${profile.name} को ब्लॉक करें`)}
                aria-label={t(`Block ${profile.name}`, `${profile.name} को ब्लॉक करें`)}
              >
                <Ban className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t('Block', 'ब्लॉक')}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
              aria-label={t('Close Chat', 'चैट बंद करें')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BLOCK CONFIRMATION BANNER (SIGNED-IN ONLY) */}
        {profile && authSession && confirmBlock && !isBlocked && onBlockProfile && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 animate-in fade-in">
            <div className="flex items-start gap-2 text-xs text-rose-950">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {t(`Block ${profile.name}?`, `क्या ${profile.name} को ब्लॉक करें?`)}
                </p>
                <p className="text-[11px] text-rose-800">
                  {t(
                    'This profile will be hidden from your matches, likes, and chats. You can unblock anytime in Settings.',
                    'यह प्रोफ़ाइल आपकी खोज, पसंद और चैट से हट जाएगी। आप सेटिंग्स से कभी भी अनब्लॉक कर सकते हैं।'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setConfirmBlock(false)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                {t('Cancel', 'रद्द करें')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onBlockProfile(profile);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{t('Confirm Block', 'ब्लॉक करें')}</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBHEADER NOTICE */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200/70 flex items-center justify-between text-[11px] text-amber-900 shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{t('Direct Community Alliance Chat • Keep conversations respectful', 'प्रत्यक्ष समाज रिश्ता चैट • कृपया संवाद मर्यादित एवं सम्मानजनक रखें')}</span>
          </div>
          {profile && onSelectKundaliProfile && !isBlocked && (
            <button
              onClick={() => {
                onClose();
                onSelectKundaliProfile(profile.id, profile.gender);
              }}
              className="text-[10px] bg-amber-700 hover:bg-amber-800 text-white font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer hidden sm:block"
            >
              {t('Check Kundali Milan →', 'कुंडली मिलान देखें →')}
            </button>
          )}
        </div>

        {/* MESSAGE HISTORY / STATES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/70">
          {!currentUid ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300">
                <LogIn className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-stone-900 text-base">
                {t('Sign In for Live Family Chat', 'लाइव परिवार चैट के लिए साइन इन करें')}
              </h4>
              <p className="text-xs text-stone-600 max-w-sm leading-relaxed">
                {t(
                  'Please sign in with Google or your registered Email & Password so your messages are securely saved and synced in real time across devices.',
                  'कृपया Google या पंजीकृत ईमेल व पासवर्ड से साइन इन करें ताकि आपके संदेश सुरक्षित रहें और सभी डिवाइस पर रियल-टाइम सिंक हों।'
                )}
              </p>
              {onNavigateToSignIn && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToSignIn();
                  }}
                  className="bg-gradient-to-r from-[#380812] to-[#540e1b] text-amber-200 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('Sign In / Register', 'साइन इन / पंजीकरण करें')}</span>
                </button>
              )}
            </div>
          ) : isOwnProfileChat ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-stone-900 text-base">
                {t('This is Your Published Profile', 'यह आपकी अपनी प्रकाशित प्रोफ़ाइल है')}
              </h4>
              <p className="text-xs text-stone-600 max-w-sm leading-relaxed">
                {t(
                  'To read and reply to families who messaged you about this biodata, open your Dashboard Messages inbox.',
                  'जिन परिवारों ने इस बायोडाटा के लिए आपसे संपर्क किया है, उनके संदेश देखने और उत्तर देने के लिए अपना डैशबोर्ड संदेश इनबॉक्स खोलें।'
                )}
              </p>
              {onOpenInbox && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInbox();
                  }}
                  className="bg-gradient-to-r from-[#380812] to-[#540e1b] text-amber-200 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('Open Dashboard Messages', 'डैशबोर्ड संदेश खोलें')}</span>
                </button>
              )}
            </div>
          ) : !otherUid ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300">
                <Phone className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-stone-900 text-base">
                {t('Direct Phone Contact Recommended', 'सीधे फ़ोन संपर्क की सलाह')}
              </h4>
              <p className="text-xs text-stone-600 max-w-sm leading-relaxed">
                {t(
                  'This Samaj booklet entry is not yet linked to an online user account for live in-app messaging. Please connect directly by phone with the family.',
                  'यह समाज पुस्तिका प्रविष्टि अभी लाइव इन-ऐप चैट के लिए ऑनलाइन सदस्य खाते से जुड़ी नहीं है। कृपया परिवार से सीधे फ़ोन द्वारा संपर्क करें।'
                )}
              </p>
              {firstPhone && (
                <a
                  href={`tel:${firstPhone}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t(`Call ${firstPhone}`, `कॉल करें ${firstPhone}`)}</span>
                </a>
              )}
            </div>
          ) : isLoadingMessages ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-2.5 text-stone-500">
              <Loader2 className="w-7 h-7 animate-spin text-[#6e1628]" />
              <p className="text-xs font-semibold">
                {t('Loading live conversation...', 'लाइव संवाद लोड हो रहा है...')}
              </p>
            </div>
          ) : loadError ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-2.5 my-4">
              <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
              <p className="text-xs font-semibold text-rose-900">{loadError}</p>
              <button
                type="button"
                onClick={() => setRetryNonce((n) => n + 1)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                {t('Retry', 'पुनः प्रयास करें')}
              </button>
            </div>
          ) : (
            <>
              <div className="text-center my-1">
                <span className="text-[10px] bg-stone-200/80 text-stone-600 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {t('End-to-End Synced Matrimonial Chat', 'रियल-टाइम वैवाहिक संवाद')}
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="text-center py-10 px-4 space-y-2">
                  <MessageCircle className="w-8 h-8 text-amber-700/50 mx-auto" />
                  <p className="text-xs font-semibold text-stone-700">
                    {t(
                      `No messages yet with ${displayName}.`,
                      `${displayName} के साथ अभी कोई संदेश नहीं है।`
                    )}
                  </p>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                    {t(
                      'Send a greeting below or tap a quick Samaj icebreaker to begin a real two-way conversation.',
                      'वास्तविक बातचीत शुरू करने के लिए नीचे संदेश लिखें या त्वरित समाज संदेश चुनें।'
                    )}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUid;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <span className="text-[10px] font-semibold text-stone-500 px-1">
                        {isMine ? t('You', 'आप') : msg.senderName}
                      </span>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed break-words ${
                          isMine
                            ? 'bg-gradient-to-r from-[#4c0d1b] to-[#6e1628] text-amber-100 rounded-br-xs border border-amber-500/20'
                            : 'bg-white text-stone-800 rounded-bl-xs border border-stone-200/90'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                            isMine ? 'text-amber-200/70' : 'text-stone-400'
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {isMine && (
                            msg.status === 'sending' ? (
                              <Clock
                                className="w-3 h-3 text-amber-200/60"
                                aria-label={t('Sending', 'भेजा जा रहा है')}
                              />
                            ) : msg.status === 'read' ? (
                              <CheckCheck
                                className="w-3 h-3 text-emerald-400"
                                aria-label={t('Read', 'पढ़ा गया')}
                              />
                            ) : (
                              <Check
                                className="w-3 h-3 text-amber-200/80"
                                aria-label={t('Sent', 'भेजा गया')}
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* QUICK ICEBREAKER PROMPTS & COMPOSER (OR BLOCKED / UNAVAILABLE STATE) */}
        {isBlocked ? (
          <div className="p-4 bg-rose-50 border-t border-rose-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-rose-900">
            <div className="flex items-center gap-2 font-medium">
              <Ban className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{t('You blocked this profile. Messaging is disabled.', 'आपने इस प्रोफ़ाइल को ब्लॉक किया है। संदेश बंद हैं।')}</span>
            </div>
            {profile && authSession && onUnblockProfile && (
              <button
                type="button"
                onClick={() => onUnblockProfile(profile.id)}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 font-bold text-xs cursor-pointer shrink-0"
              >
                {t('Unblock Profile', 'अनब्लॉक करें')}
              </button>
            )}
          </div>
        ) : canChatLive ? (
          <>
            {sendError && (
              <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">{sendError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSendError(null)}
                  className="text-rose-700 hover:text-rose-900 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="p-2.5 bg-white border-t border-stone-200 shrink-0 overflow-x-auto">
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-700" /> {t('Quick Samaj Icebreakers:', 'त्वरित समाज संदेश:')}
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSending}
                    onClick={() => void handleSendMessage(prompt)}
                    className="shrink-0 text-[11px] bg-stone-100 hover:bg-amber-100 hover:text-amber-950 disabled:opacity-50 text-stone-700 font-medium px-2.5 py-1 rounded-lg border border-stone-200 transition-colors cursor-pointer text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* INPUT COMPOSER */}
            <div className="p-3 bg-white border-t border-stone-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  maxLength={2000}
                  disabled={isSending}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    if (sendError) setSendError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t(`Type message to ${displayName}...`, `${displayName} को संदेश लिखें...`)}
                  className="flex-1 text-xs bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900 transition-all disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] disabled:opacity-50 text-amber-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {isSending ? t('Sending...', 'भेज रहे हैं...') : t('Send', 'भेजें')}
                  </span>
                </button>
              </form>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

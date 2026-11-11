import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Phone, MessageSquare, ShieldCheck, Sparkles, 
  CheckCheck, Heart, User, Clock, ChevronRight
} from 'lucide-react';
import { MatrimonyProfile, ChatMessage, AuthSession } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ChatModalProps {
  profile: MatrimonyProfile;
  authSession: AuthSession | null;
  onClose: () => void;
  onSelectKundaliProfile?: (id: number | string, gender: 'Male' | 'Female') => void;
}

const QUICK_PROMPTS_EN = [
  "Jai Mataji Ki! We saw your biodata and would like to connect.",
  "Greetings! Can we speak with the candidate's parents regarding Gotra?",
  "Kindly share your family's astrological Kundali / Patrika details.",
  "We are also from the same region. Let's exchange family contact numbers."
];

const QUICK_PROMPTS_HI = [
  "जय माताजी की! हमने आपका बायोडाटा देखा और हम जुड़ना चाहते हैं।",
  "नमस्ते! क्या हम गोत्र एवं रिश्ते के बारे में माता-पिता से बात कर सकते हैं?",
  "कृपया अपने परिवार की जन्मपत्रिका / कुंडली विवरण साझा करें।",
  "हम भी उसी क्षेत्र से हैं। आइए परिवार के संपर्क नंबर साझा करें।"
];

export const ChatModal: React.FC<ChatModalProps> = ({
  profile,
  authSession,
  onClose,
  onSelectKundaliProfile
}) => {
  const { lang, t } = useLanguage();
  const profileKey = profile.id.toString();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = lang === 'hi' ? QUICK_PROMPTS_HI : QUICK_PROMPTS_EN;

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('samaj_chat_messages');
      if (stored) {
        const parsed: Record<string, ChatMessage[]> = JSON.parse(stored);
        if (parsed[profileKey] && Array.isArray(parsed[profileKey])) {
          return parsed[profileKey];
        }
      }
    } catch (e) {
      console.error("Error loading chat messages:", e);
    }

    return [
      {
        id: `init-${profile.id}`,
        profileId: profile.id,
        sender: 'candidate',
        senderName: lang === 'hi' ? `${profile.name} का परिवार` : `${profile.name}'s Family`,
        text: lang === 'hi'
          ? `जय माताजी की! ${profile.name} के सत्यापित वैवाहिक प्रोफ़ाइल में आपका स्वागत है। आप हमारे गोत्र (${profile.gotra}), पारिवारिक पृष्ठभूमि के बारे में पूछ सकते हैं या अभिभावक संवाद तय कर सकते हैं।`
          : `Jai Mataji Ki! Welcome to ${profile.name}'s verified matrimonial profile. Feel free to ask about our Gotra (${profile.gotra}), family background, or schedule a parent-to-parent conversation.`,
        timestamp: lang === 'hi' ? 'आज सक्रिय' : 'Active today'
      }
    ];
  });

  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const saveMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    try {
      const stored = localStorage.getItem('samaj_chat_messages');
      const parsed: Record<string, ChatMessage[]> = stored ? JSON.parse(stored) : {};
      parsed[profileKey] = newMessages;
      localStorage.setItem('samaj_chat_messages', JSON.stringify(parsed));
    } catch (e) {
      console.error("Error saving chat messages:", e);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      profileId: profile.id,
      sender: 'user',
      senderName: authSession?.name || t('You (Interested Family)', 'आप (इच्छुक परिवार)'),
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    saveMessages(updated);
    setInputMessage('');

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        profileId: profile.id,
        sender: 'candidate',
        senderName: lang === 'hi' ? `${profile.name} का परिवार` : `${profile.name}'s Family`,
        text: lang === 'hi'
          ? `जय माताजी की! संपर्क करने के लिए धन्यवाद। हमें ${profile.name} (${profile.gotra} गोत्र) के संबंध में आपका संदेश प्राप्त हुआ है। हमारे परिजन विवरण देखकर शीघ्र उत्तर देंगे। आप सीधे ${profile.contact} पर भी संपर्क कर सकते हैं।`
          : `Jai Mataji Ki! Thank you for reaching out. We have received your note regarding ${profile.name} (${profile.gotra} Gotra). Our elders will review the details and respond shortly. You may also reach us directly at ${profile.contact}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      saveMessages([...updated, replyMsg]);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const photoUrl = profile.photo && profile.photo.trim() !== ''
    ? profile.photo
    : profile.gender === 'Female'
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";

  const firstPhone = profile.contact ? profile.contact.split(',')[0].trim() : '';

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
                alt={profile.name} 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover object-top border-2 border-amber-300 shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#380812] rounded-full" title={t('Online / Active Today', 'ऑनलाइन / आज सक्रिय')}></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-serif font-bold text-sm sm:text-base text-amber-50 leading-tight truncate">
                  {profile.name}
                </h3>
                <ShieldCheck className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0" />
              </div>
              <p className="text-[11px] text-amber-200/80 font-medium truncate">
                {t('Gotra:', 'गोत्र:')} {profile.gotra} · {profile.city} · {profile.age} {t('Yrs', 'वर्ष')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {firstPhone && (
              <a 
                href={`tel:${firstPhone}`}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 transition-colors"
                title={t(`Call ${profile.name}'s Family (${firstPhone})`, `${profile.name} के परिवार को कॉल करें (${firstPhone})`)}
              >
                <Phone className="w-4 h-4" />
              </a>
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

        {/* SUBHEADER NOTICE */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200/70 flex items-center justify-between text-[11px] text-amber-900 shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{t('Direct Community Alliance Chat • Keep conversations respectful', 'प्रत्यक्ष समाज रिश्ता चैट • कृपया संवाद मर्यादित एवं सम्मानजनक रखें')}</span>
          </div>
          {onSelectKundaliProfile && (
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

        {/* MESSAGE HISTORY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/70">
          <div className="text-center my-1">
            <span className="text-[10px] bg-stone-200/80 text-stone-600 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {t('Secure Matrimonial Discussion', 'सुरक्षित वैवाहिक संवाद')}
            </span>
          </div>

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <span className="text-[10px] font-semibold text-stone-500 px-1">
                  {msg.senderName}
                </span>

                <div 
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                    isUser 
                      ? 'bg-gradient-to-r from-[#4c0d1b] to-[#6e1628] text-amber-100 rounded-br-xs border border-amber-500/20' 
                      : 'bg-white text-stone-800 rounded-bl-xs border border-stone-200/90'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isUser ? 'text-amber-200/70' : 'text-stone-400'}`}>
                    <span>{msg.timestamp}</span>
                    {isUser && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-stone-500 text-xs italic px-2">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
              <span>{t(`${profile.name}'s family is typing...`, `${profile.name} का परिवार टाइप कर रहा है...`)}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* QUICK ICEBREAKER PROMPTS */}
        <div className="p-2.5 bg-white border-t border-stone-200 shrink-0 overflow-x-auto">
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-700" /> {t('Quick Samaj Icebreakers:', 'त्वरित समाज संदेश:')}
          </p>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="shrink-0 text-[11px] bg-stone-100 hover:bg-amber-100 hover:text-amber-950 text-stone-700 font-medium px-2.5 py-1 rounded-lg border border-stone-200 transition-colors cursor-pointer text-left"
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
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(`Type message to ${profile.name}'s family...`, `${profile.name} के परिवार को संदेश लिखें...`)}
              className="flex-1 text-xs bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] disabled:opacity-50 text-amber-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('Send', 'भेजें')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


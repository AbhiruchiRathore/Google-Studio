import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  Mail,
  MessageCircle,
  Send,
  Share2,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  copyTextToClipboard,
  getExternalLinkProps,
  isAndroidDevice,
  isAndroidWebView,
  ResolvedSharePayload,
  subscribeShareModal
} from '../utils/shareAndPrint';

export const ShareModal: React.FC = () => {
  const { t } = useLanguage();
  const [request, setRequest] = useState<ResolvedSharePayload | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [instagramCopiedNotice, setInstagramCopiedNotice] = useState(false);
  const [emailCopiedNotice, setEmailCopiedNotice] = useState(false);
  const [nativeShareFallbackNotice, setNativeShareFallbackNotice] = useState(false);

  useEffect(() => {
    return subscribeShareModal((next) => {
      setRequest(next);
      setLinkCopied(false);
      setMessageCopied(false);
      setInstagramCopiedNotice(false);
      setEmailCopiedNotice(false);
      setNativeShareFallbackNotice(false);
    });
  }, []);

  useEffect(() => {
    if (!request) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRequest(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [request]);

  if (!request) return null;

  const canNativeShare =
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function';

  const handleCopyLink = async () => {
    const ok = await copyTextToClipboard(request.url);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const handleCopyMessage = async () => {
    const ok = await copyTextToClipboard(request.fullText);
    if (ok) {
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 3000);
    }
  };

  const handleInstagramShare = async () => {
    await copyTextToClipboard(request.fullText);
    setEmailCopiedNotice(false);
    setNativeShareFallbackNotice(false);
    setInstagramCopiedNotice(true);
  };

  const handleEmailShare = async () => {
    await copyTextToClipboard(request.fullText);
    setInstagramCopiedNotice(false);
    setNativeShareFallbackNotice(false);
    setEmailCopiedNotice(true);

    // Avoid navigating Android WebView directly to mailto: (prevents net::ERR_UNKNOWN_URL_SCHEME)
    if (isAndroidDevice() || isAndroidWebView()) {
      return;
    }

    try {
      const a = document.createElement('a');
      a.href = request.mailtoUrl;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Clipboard copy & Gmail HTTPS compose banner remain shown as safe fallback
    }
  };

  const handleNativeDeviceShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: request.title,
        text: request.text,
        url: request.url
      });
    } catch (err) {
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'AbortError') {
        return;
      }
      // WebView blocked or failed navigator.share -> copy message cleanly & prompt user
      await copyTextToClipboard(request.fullText);
      setInstagramCopiedNotice(false);
      setEmailCopiedNotice(false);
      setNativeShareFallbackNotice(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => setRequest(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-share-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-amber-200 shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#380812] to-[#540e1b] px-5 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3
                id="app-share-modal-title"
                className="font-serif font-bold text-base text-amber-100 truncate"
              >
                {t('Share', 'साझा करें')}
              </h3>
              <p className="text-[11px] text-amber-200/80 truncate">
                {request.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRequest(null)}
            aria-label={t('Close share menu', 'शेयर मेनू बंद करें')}
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Preview Summary & URL */}
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-3.5 space-y-2">
            <p className="text-xs font-bold text-stone-900 line-clamp-1">
              {request.title}
            </p>
            {request.text && request.text !== request.title && (
              <p className="text-xs text-stone-600 whitespace-pre-line line-clamp-3 leading-relaxed">
                {request.text}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1.5 border-t border-stone-200/80">
              <Link2 className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span className="text-[11px] font-mono text-stone-500 truncate flex-1 select-all">
                {request.url}
              </span>
            </div>
          </div>

          {/* Instagram Clipboard Banner */}
          {instagramCopiedNotice && (
            <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-start gap-2 text-xs text-stone-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {t(
                    'Copied! Paste into Instagram (Bio, DM, or Story link/caption).',
                    'कॉपी हो गया! इसे Instagram (DM, स्टोरी या पोस्ट कैप्शन) में पेस्ट करें।'
                  )}
                </span>
              </div>
              <a
                {...getExternalLinkProps(request.instagramUrl)}
                className="w-full min-h-[44px] bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>{t('Open Instagram', 'Instagram खोलें')}</span>
              </a>
            </div>
          )}

          {/* Email Android-Safe Notice & Gmail HTTPS Compose Banner */}
          {emailCopiedNotice && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-start gap-2 text-xs text-stone-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {t(
                    'Message copied! Tap below to open Gmail compose or paste into any Email app.',
                    'संदेश कॉपी हो गया! नीचे से Gmail खोलें या अपने ईमेल ऐप में पेस्ट करें।'
                  )}
                </span>
              </div>
              <a
                {...getExternalLinkProps(request.gmailComposeUrl)}
                className="w-full min-h-[44px] bg-[#380812] hover:bg-[#540e1b] text-amber-200 font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{t('Compose in Gmail', 'Gmail में ईमेल लिखें')}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </a>
            </div>
          )}

          {/* Native Share Fallback Notice */}
          {nativeShareFallbackNotice && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2 text-xs text-emerald-950 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {t(
                  'Message copied! Tap WhatsApp, Telegram, X, or Instagram above to share directly.',
                  'संदेश कॉपी हो गया! सीधे साझा करने के लिए ऊपर WhatsApp, Telegram, X या Instagram चुनें।'
                )}
              </span>
            </div>
          )}

          {/* Share Destinations Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* WhatsApp */}
            <a
              {...getExternalLinkProps(request.waMeUrl)}
              className="min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>{t('WhatsApp', 'व्हाट्सएप')}</span>
            </a>

            {/* Instagram */}
            <button
              type="button"
              onClick={handleInstagramShare}
              className="min-h-[48px] bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:opacity-95 active:scale-[0.98] text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span>{t('Instagram', 'इंस्टाग्राम')}</span>
            </button>

            {/* Telegram */}
            <a
              {...getExternalLinkProps(request.telegramUrl)}
              className="min-h-[48px] bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>{t('Telegram', 'टेलीग्राम')}</span>
            </a>

            {/* X / Twitter */}
            <a
              {...getExternalLinkProps(request.twitterUrl)}
              className="min-h-[48px] bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>{t('X / Twitter', 'X / ट्विटर')}</span>
            </a>

            {/* Email (Android-safe button avoiding WebView mailto: ERR_UNKNOWN_URL_SCHEME) */}
            <button
              type="button"
              onClick={handleEmailShare}
              className="min-h-[48px] bg-amber-100 hover:bg-amber-200 active:scale-[0.98] text-[#380812] border border-amber-300 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#6e1628] shrink-0" />
              <span>{t('Email', 'ईमेल')}</span>
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`min-h-[48px] font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-[0.98] ${
                linkCopied
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'
              }`}
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('Copied!', 'कॉपी हो गया!')}</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 text-stone-600 shrink-0" />
                  <span>{t('Copy Link', 'लिंक कॉपी करें')}</span>
                </>
              )}
            </button>
          </div>

          {/* Secondary Utility Actions */}
          <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                messageCopied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              {messageCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('Copied Full Message!', 'पूरा संदेश कॉपी हो गया!')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-500 shrink-0" />
                  <span>{t('Copy Full Message', 'पूरा संदेश कॉपी करें')}</span>
                </>
              )}
            </button>

            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeDeviceShare}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#380812] hover:bg-[#540e1b] text-amber-200 border border-amber-400/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{t('More Apps', 'अन्य ऐप्स')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

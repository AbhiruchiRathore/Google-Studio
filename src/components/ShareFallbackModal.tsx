import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Share2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  copyTextToClipboard,
  ShareModalRequest,
  subscribeShareModal
} from '../utils/shareAndPrint';

export const ShareFallbackModal: React.FC = () => {
  const { t } = useLanguage();
  const [request, setRequest] = useState<ShareModalRequest | null>(null);
  const [copiedNow, setCopiedNow] = useState(false);

  useEffect(() => {
    return subscribeShareModal((next) => {
      setRequest(next);
      setCopiedNow(next.copied);
    });
  }, []);

  if (!request) return null;

  const handleCopyAgain = async () => {
    const ok = await copyTextToClipboard(request.text);
    setCopiedNow(ok);
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => setRequest(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-fallback-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-amber-200 shadow-2xl overflow-hidden animate-in fade-in"
      >
        <div className="bg-gradient-to-r from-[#380812] to-[#540e1b] px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h3
                id="share-fallback-modal-title"
                className="font-serif font-bold text-sm sm:text-base text-amber-100 truncate"
              >
                {t('Share via WhatsApp or Message', 'व्हाट्सएप या संदेश द्वारा साझा करें')}
              </h3>
              {request.phone && (
                <p className="text-[11px] text-amber-200/80 font-mono truncate">
                  {request.phone}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRequest(null)}
            aria-label={t('Close share modal', 'बंद करें')}
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {copiedNow && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs text-emerald-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {t(
                  'Message copied to clipboard! Paste it directly in WhatsApp or any group.',
                  'संदेश कॉपी हो गया है! इसे सीधे व्हाट्सएप या किसी भी ग्रुप में पेस्ट करें।'
                )}
              </span>
            </div>
          )}

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 max-h-44 overflow-y-auto text-xs text-stone-700 whitespace-pre-wrap leading-relaxed select-all">
            {request.text}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleCopyAgain}
              className="flex-1 min-h-[44px] bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              {copiedNow ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>{t('Copied! Copy Again', 'कॉपी हो गया! पुनः कॉपी करें')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{t('Copy Message & Link', 'संदेश व लिंक कॉपी करें')}</span>
                </>
              )}
            </button>

            {!request.isWebView && (
              <a
                href={request.apiUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(() => setRequest(null), 200)}
                className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>{t('Open WhatsApp', 'व्हाट्सएप खोलें')}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

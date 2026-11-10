import React, { useState, useEffect } from 'react';
import { Share2, ExternalLink, Copy, Check, X, MessageCircle, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  shareViaWhatsApp,
  WHATSAPP_SHARE_EVENT,
  WhatsAppSharePayload,
  copyTextToClipboard
} from '../utils/shareAndPrint';

export const WhatsAppShare: React.FC = () => {
  const { t } = useLanguage();
  const [activeShare, setActiveShare] = useState<WhatsAppSharePayload | null>(null);
  const [copiedNow, setCopiedNow] = useState(false);

  const shareText = t(
    `🚩 *Rathore Rishtey - Digital Matrimonial Portal* 🚩\n\n✨ Verified Matrimonial Biodatas\n✨ Vedic 36-Guna Kundali Milan\n✨ Business & Shop Directory\n✨ Digital Samaj E-Booklet\n\n👉 Join and explore now: https://svayaa.com/\n_Powered by Svayaa_`,
    `🚩 *राठौड़ रिश्ते - डिजिटल वैवाहिक एवं समाज पोर्टल* 🚩\n\n✨ सत्यापित वर-वधु बायोडाटा\n✨ वैदिक ३६ गुण कुंडली मिलान\n✨ व्यापार एवं दुकान निर्देशिका\n✨ डिजिटल समाज ई-पत्रिका\n\n👉 अभी जुड़ें और देखें: https://svayaa.com/\n_Powered by Svayaa_`
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<WhatsAppSharePayload>;
      if (customEvent.detail) {
        setActiveShare(customEvent.detail);
        setCopiedNow(customEvent.detail.copied);
      }
    };
    window.addEventListener(WHATSAPP_SHARE_EVENT, handler);
    return () => window.removeEventListener(WHATSAPP_SHARE_EVENT, handler);
  }, []);

  const handleCopy = async () => {
    if (!activeShare) return;
    const ok = await copyTextToClipboard(activeShare.text);
    if (ok) {
      setCopiedNow(true);
      setTimeout(() => setCopiedNow(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (!activeShare || typeof navigator === 'undefined' || !navigator.share) return;
    try {
      await navigator.share({
        title: 'Rathore Rishtey',
        text: activeShare.text
      });
    } catch {
      // User cancelled share sheet
    }
  };

  const canUseWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <>
      {/* Global Non-blocking WhatsApp Share Assistant (guarantees sharing works in iframes, desktop, and Android WebView) */}
      {activeShare && (
        <div
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 bg-white border-2 border-emerald-500/70 rounded-2xl shadow-2xl p-4 space-y-3 animate-in fade-in"
          role="dialog"
          aria-label={t('Share on WhatsApp', 'व्हाट्सऐप पर साझा करें')}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  {t('Share on WhatsApp Ready', 'व्हाट्सऐप शेयर तैयार है')}
                </h4>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {copiedNow
                    ? t('Message copied to clipboard! Choose how to open WhatsApp:', 'संदेश कॉपी हो गया! व्हाट्सऐप खोलने का विकल्प चुनें:')
                    : t('Tap below to send directly via WhatsApp:', 'व्हाट्सऐप द्वारा भेजने के लिए नीचे टैप करें:')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveShare(null)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
              aria-label={t('Close', 'बंद करें')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-[11px] text-stone-700 max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {activeShare.text}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={activeShare.waMeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[130px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('Open WhatsApp', 'व्हाट्सऐप खोलें')}</span>
            </a>

            <a
              href={activeShare.deepLink}
              rel="noopener noreferrer"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              title={t('Launch WhatsApp App directly on phone', 'फ़ोन में सीधे व्हाट्सऐप ऐप खोलें')}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t('App Link', 'ऐप लिंक')}</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedNow ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNow ? t('Copied', 'कॉपी हुआ') : t('Copy', 'कॉपी')}</span>
            </button>

            {canUseWebShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-semibold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t('More Apps', 'अन्य ऐप')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Share App on WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => shareViaWhatsApp(shareText)}
          aria-label={t('Share App on WhatsApp', 'व्हाट्सएप पर ऐप शेयर करें')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 border-2 border-white group relative cursor-pointer"
        >
          <Share2 className="w-6 h-6" />

          {/* Tooltip text on hover for desktop */}
          <span className="absolute right-16 bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {t('Share App on WhatsApp', 'व्हाट्सएप पर ऐप शेयर करें')}
          </span>
        </button>
      </div>
    </>
  );
};

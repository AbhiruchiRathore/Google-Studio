import React from 'react';
import { Share2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAdminConfig } from '../context/AdminConfigContext';
import { getWhatsAppLinkProps } from '../utils/shareAndPrint';

export const WhatsAppShare: React.FC = () => {
  const { t } = useLanguage();
  const { config } = useAdminConfig();

  const shareText = t(
    `🚩 *Rathore Rishtey - Digital Matrimonial Portal* 🚩\n\n✨ Verified Matrimonial Biodatas\n✨ Vedic 36-Guna Kundali Milan\n✨ Business & Shop Directory\n✨ Digital Samaj E-Booklet\n\n👉 Join and explore now: https://svayaa.com/\n_Powered by Svayaa_`,
    `🚩 *राठौड़ रिश्ते - डिजिटल वैवाहिक एवं समाज पोर्टल* 🚩\n\n✨ सत्यापित वर-वधु बायोडाटा\n✨ वैदिक ३६ गुण कुंडली मिलान\n✨ व्यापार एवं दुकान निर्देशिका\n✨ डिजिटल समाज ई-पत्रिका\n\n👉 अभी जुड़ें और देखें: https://svayaa.com/\n_Powered by Svayaa_`
  );

  if (!config.featureWhatsAppShareEnabled) {
    return null;
  }

  const linkProps = getWhatsAppLinkProps(shareText);

  return (
    <div className="fixed bottom-[calc(1rem+var(--sab))] right-[calc(0.875rem+var(--sar))] sm:bottom-[calc(1.5rem+var(--sab))] sm:right-[calc(1.5rem+var(--sar))] z-[45] pointer-events-auto">
      <a
        {...linkProps}
        aria-label={t('Share App on WhatsApp', 'व्हाट्सएप पर ऐप शेयर करें')}
        title={t('Share on WhatsApp', 'व्हाट्सएप पर शेयर करें')}
        className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 border-2 border-white group relative cursor-pointer touch-manipulation select-none"
      >
        <Share2 className="w-6 h-6" />

        {/* Tooltip text on hover for desktop */}
        <span className="hidden sm:block absolute right-16 bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {t('Share on WhatsApp', 'व्हाट्सएप पर शेयर करें')}
        </span>
      </a>
    </div>
  );
};

import React from 'react';
import { Share2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const WhatsAppShare: React.FC = () => {
  const { t } = useLanguage();

  const shareText = encodeURIComponent(
    t(
      `🚩 *Rathore Rishtey - Digital Matrimonial Portal* 🚩\n\n✨ Verified Matrimonial Biodatas\n✨ Vedic 36-Guna Kundali Milan\n✨ Business & Shop Directory\n✨ Digital Samaj E-Booklet\n\n👉 Join and explore now: https://svayaa.com/\n_Powered by Svayaa.com_`,
      `🚩 *राठौड़ रिश्ते - डिजिटल वैवाहिक एवं समाज पोर्टल* 🚩\n\n✨ सत्यापित वर-वधु बायोडाटा\n✨ वैदिक ३६ गुण कुंडली मिलान\n✨ व्यापार एवं दुकान निर्देशिका\n✨ डिजिटल समाज ई-पत्रिका\n\n👉 अभी जुड़ें और देखें: https://svayaa.com/\n_Powered by Svayaa.com_`
    )
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a 
        href={`https://api.whatsapp.com/send?text=${shareText}`} 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label={t('Share App on WhatsApp', 'व्हाट्सएप पर ऐप शेयर करें')}
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 border-2 border-white group relative cursor-pointer"
      >
        <Share2 className="w-6 h-6" />
        
        {/* Tooltip text on hover for desktop */}
        <span className="absolute right-16 bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {t('Share App on WhatsApp', 'व्हाट्सएप पर ऐप शेयर करें')}
        </span>
      </a>
    </div>
  );
};

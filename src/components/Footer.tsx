import React from 'react';
import { TabType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigateTab: (tab: TabType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gradient-to-b from-[#24050b] to-[#140205] text-stone-300 border-t border-amber-500/30 py-10 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Blessing & Motto */}
        <div className="text-center pb-6 border-b border-amber-500/20">
          <p className="text-xs sm:text-sm font-serif text-amber-200/90 tracking-widest uppercase">
            {t(
              'Rathore Kshatriya Rajput Samaj • Digital Matrimonial & Community Network',
              '॥ संघे शक्तिः कलियुगे • राठौड़ क्षत्रिय राजपूत समाज • जय माताजी की ॥'
            )}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {t(
              'Dedicated to bringing community families together through verified digital networking',
              'सत्यापित डिजिटल नेटवर्क के माध्यम से समाज के परिवारों को जोड़ने हेतु समर्पित'
            )}
          </p>
        </div>

        {/* Main Footer Grid */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs">
          <div className="text-center md:text-left space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold flex items-center justify-center text-xs font-serif">
                RR
              </div>
              <p className="font-bold text-amber-100 text-sm font-serif tracking-wide">
                {t('Rathore Rishtey • Matrimonial Network', 'राठौड़ रिश्ते • वैवाहिक नेटवर्क')}
              </p>
            </div>
            <p className="text-stone-400 max-w-md">
              {t(
                'Connecting 28+ Gotras across MP, Maharashtra, Rajasthan & nationwide. Replacing printed patrika books with a verified, secure digital network.',
                'मध्यप्रदेश, महाराष्ट्र, राजस्थान और देशभर के २८+ गोत्रों को जोड़ने वाला एकमात्र सुरक्षित एवं सत्यापित डिजिटल वैवाहिक मंच।'
              )}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-stone-300">
            <button 
              onClick={() => { onNavigateTab('matrimony'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="hover:text-amber-300 cursor-pointer transition-colors"
            >
              {t('Matrimony Bios', 'वैवाहिक बायोडाटा')}
            </button>
            <button 
              onClick={() => { onNavigateTab('kundali'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="hover:text-amber-300 font-semibold text-amber-200/90 cursor-pointer transition-colors"
            >
              {t('Kundali Milan (36 Gunas)', 'कुंडली मिलान (३६ गुण)')}
            </button>
            <button 
              onClick={() => { onNavigateTab('guest-list'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="hover:text-amber-300 cursor-pointer transition-colors"
            >
              {t('Guest List Planner', 'अतिथि सूची प्लानर')}
            </button>
            <button 
              onClick={() => { onNavigateTab('directory'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="hover:text-amber-300 cursor-pointer transition-colors"
            >
              {t('Business Ads', 'व्यापार निर्देशिका')}
            </button>
            <button 
              onClick={() => { onNavigateTab('booklet'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="hover:text-amber-300 cursor-pointer transition-colors"
            >
              {t('Digital E-Booklet', 'डिजिटल ई-पत्रिका')}
            </button>
            <button 
              onClick={() => { onNavigateTab('events'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="hover:text-amber-300 cursor-pointer transition-colors"
            >
              {t('Samaj Events', 'समाज कार्यक्रम')}
            </button>
            <button 
              onClick={() => { onNavigateTab('family-details'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="hover:text-amber-300 cursor-pointer transition-colors"
            >
              {t('Add Family Details', 'पारिवारिक विवरण जोड़ें')}
            </button>
          </div>
        </div>

        {/* Bottom Copyright & Powered by Svayaa */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-stone-500 pt-6 border-t border-white/5 gap-3 text-center sm:text-left">
          <div>
            {t(
              '© 2026 Rathore Rishtey Digital Portal. Dedicated to Rathore Samaj Samiti & community families.',
              '© २०२६ राठौड़ रिश्ते डिजिटल पोर्टल। राठौड़ समाज समिति एवं समस्त परिवारों को समर्पित।'
            )}
          </div>
          <div>
            <a 
              href="https://svayaa.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-amber-300 hover:text-amber-200 font-medium underline decoration-amber-400/60 hover:decoration-amber-300 transition-colors"
            >
              Powered by Svayaa
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

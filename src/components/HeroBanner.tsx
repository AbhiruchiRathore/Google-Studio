import React from 'react';
import { Users, BookOpen, Sparkles, ArrowRight, HeartHandshake } from 'lucide-react';
import { TabType, AuthSession } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAdminConfig } from '../context/AdminConfigContext';

interface HeroBannerProps {
  onNavigateTab?: (tab: TabType) => void;
  authSession?: AuthSession | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onNavigateTab, authSession }) => {
  const { t } = useLanguage();
  const { config } = useAdminConfig();

  const targetActionTab = (loggedInTab: TabType): TabType => {
    return authSession ? loggedInTab : 'signup';
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#24050b] via-[#330710] to-[#1c0307] text-white border-b border-amber-500/30">
      {/* Background Decorative Ambient Circles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Sacred Invocation Bar */}
      <div className="border-b border-amber-500/20 py-2 px-3 sm:px-4 text-center">
        <p className="text-[11px] sm:text-xs text-amber-200/90 font-serif tracking-wide sm:tracking-widest flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 leading-snug">
          <span>॥ श्री गणेशाय नमः ॥</span>
          <span className="text-amber-500/60">•</span>
          <span>॥ ॐ कुलदेव्यै नमः ॥</span>
          <span className="text-amber-500/60">•</span>
          <span>॥ जय माताजी की ॥</span>
        </p>
      </div>

      {/* Hero Content Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-3.5 sm:space-y-4">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] sm:text-xs font-semibold tracking-wide shadow-xs max-w-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="leading-snug">{t('Annual Samaj Digital Patrika & Matrimony Sangam — 2026', 'वार्षिक समाज डिजिटल पत्रिका एवं विवाह संगम — २०२६')}</span>
          </div>

          {/* Grand Headline */}
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-amber-50 tracking-tight leading-tight">
            {t('Rathore Rishtey • ', 'राठौर रिश्ते • ')}
            <span className="text-gold-gradient">{t('Shubh Vivah', 'शुभ विवाह')}</span>
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-stone-300 max-w-2xl mx-auto font-light leading-relaxed px-1">
            {t(
              'Welcome to the trusted digital sanctuary for Rathore Samaj families across MP, Rajasthan, Maharashtra, and nationwide. Explore 100% verified groom & bride biodatas and discover community-owned businesses.',
              'मध्यप्रदेश, राजस्थान, महाराष्ट्र और देशभर के राठौड़ समाज परिवारों के विश्वसनीय डिजिटल मंच पर आपका स्वागत है। १००% सत्यापित वर-वधु बायोडाटा देखें और समाज के व्यापारियों से जुड़ें।'
            )}
          </p>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
            {config.featureMatrimonyEnabled && (
              <button
                onClick={() => onNavigateTab && onNavigateTab(targetActionTab('matrimony'))}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
              >
                <Users className="w-4 h-4 text-stone-950" />
                <span>{t('Browse Biodatas', 'बायोडाटा देखें')}</span>
              </button>
            )}

            {config.featureProfileCreationEnabled && (
              <button
                onClick={() => onNavigateTab && onNavigateTab(targetActionTab('create-profile'))}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/40 font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
              >
                <HeartHandshake className="w-4 h-4 text-amber-300" />
                <span>{t('Create Profile', 'अपना बायोडाटा बनाएं')}</span>
              </button>
            )}

            {config.featureBookletEnabled && (
              <button
                onClick={() => onNavigateTab && onNavigateTab('booklet')}
                className="w-full sm:w-auto text-stone-300 hover:text-amber-300 font-medium px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{t('Digital E-Patrika', 'डिजिटल ई-पत्रिका')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Trust Pillars / Metrics */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-amber-500/20 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-5xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-400/20 text-center">
            <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">450+</p>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium mt-0.5">
              {t('Verified Biodatas', 'सत्यापित बायोडाटा')}
            </p>
            <p className="text-[10px] text-amber-200/60 mt-0.5">
              {t('Groom & Bride Directory', 'वर-वधु परिचय')}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-400/20 text-center">
            <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">28</p>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium mt-0.5">
              {t('Gotras Indexed', 'सूचीबद्ध गोत्र')}
            </p>
            <p className="text-[10px] text-amber-200/60 mt-0.5">
              {t('Gotra Classification', 'गोत्र वर्गीकरण')}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-400/20 text-center">
            <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">120+</p>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium mt-0.5">
              {t('Samaj Businesses', 'समाज व्यापार')}
            </p>
            <p className="text-[10px] text-amber-200/60 mt-0.5">
              {t('Business Directory', 'व्यापार निर्देशिका')}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-400/20 text-center">
            <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">100%</p>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium mt-0.5">
              {t('Family Verified', 'परिवार सत्यापित')}
            </p>
            <p className="text-[10px] text-amber-200/60 mt-0.5">
              {t('Trusted Contacts', 'सत्यापित संपर्क')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

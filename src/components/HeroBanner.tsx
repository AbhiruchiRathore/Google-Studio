import React from 'react';
import { ShieldCheck, Users, Store, BookOpen, Sparkles, ArrowRight, HeartHandshake } from 'lucide-react';
import { TabType, AuthSession } from '../types';

interface HeroBannerProps {
  onNavigateTab?: (tab: TabType) => void;
  authSession?: AuthSession | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onNavigateTab, authSession }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#24050b] via-[#330710] to-[#1c0307] text-white border-b border-amber-500/30">
      {/* Background Decorative Ambient Circles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Sacred Invocation Bar */}
      <div className="border-b border-amber-500/20 py-2 px-4 text-center">
        <p className="text-[11px] sm:text-xs text-amber-200/90 font-serif tracking-widest flex items-center justify-center gap-2">
          <span>॥ श्री गणेशाय नमः ॥</span>
          <span className="text-amber-500/60 hidden sm:inline">•</span>
          <span className="hidden sm:inline">॥ ॐ कुलदेव्यै नमः ॥</span>
          <span className="text-amber-500/60 hidden sm:inline">•</span>
          <span>॥ जय माताजी की ॥</span>
        </p>
      </div>

      {/* Hero Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>वार्षिक समाज डिजिटल पत्रिका एवं विवाह संगम — 2026</span>
          </div>

          {/* Grand Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-amber-50 tracking-tight leading-tight">
            राठौड़ रिश्ते • <span className="text-gold-gradient">Rathore Rishtey</span>
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-stone-300 max-w-2xl mx-auto font-light leading-relaxed">
            Welcome to the trusted digital sanctuary for Rathore Samaj families across MP, Rajasthan, Maharashtra, and nationwide. Explore 100% verified groom & bride biodatas and discover community-owned businesses.
          </p>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigateTab && onNavigateTab('Sign In')}
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
            >
              <Users className="w-4 h-4 text-stone-950" />
              <span>Browse Biodatas (बायोडाटा देखें)</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('family-details')}
              className="bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/40 font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              <HeartHandshake className="w-4 h-4 text-amber-300" />
              <span>Add Family Details (पारिवारिक विवरण)</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('booklet')}
              className="text-stone-300 hover:text-amber-300 font-medium px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Digital E-Patrika</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Trust Pillars / Metrics */}
        <div className="mt-8 pt-6 border-t border-amber-500/20 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-400/20 text-center">
            <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">450+</p>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium mt-0.5">Verified Biodatas</p>
            <p className="text-[10px] text-amber-200/60 mt-0.5">वर-वधु परिचय</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-400/20 text-center">
            <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">28</p>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium mt-0.5">Gotras Indexed</p>
            <p className="text-[10px] text-amber-200/60 mt-0.5">गोत्र वर्गीकरण</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-400/20 text-center">
            <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">120+</p>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium mt-0.5">Samaj Businesses</p>
            <p className="text-[10px] text-amber-200/60 mt-0.5">व्यापार निर्देशिका</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-400/20 text-center">
            <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">100%</p>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium mt-0.5">Family Verified</p>
            <p className="text-[10px] text-amber-200/60 mt-0.5">सत्यापित संपर्क</p>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { BookOpen, FileText, Search, ChevronLeft, ChevronRight, CheckCircle2, Lock } from 'lucide-react';
import { TabType } from '../types';
import { BOOKLET_PAGES } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { useAdminConfig } from '../context/AdminConfigContext';

interface BookletTabProps {
  onNavigateTab: (tab: TabType) => void;
}

export const BookletTab: React.FC<BookletTabProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();
  const { config } = useAdminConfig();
  const [currentPage, setCurrentPage] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadPDF = () => {
    if (!config.allowGuestDownloads) return;
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 1200);
  };

  const pageData = BOOKLET_PAGES[currentPage];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200/90 p-6 md:p-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-900 text-xs font-semibold">
            {t('Interactive Community Patrika', 'इंटरैक्टिव समाज पत्रिका')}
          </span>
          <h2 className="text-3xl font-serif font-bold text-stone-900">
            {t('Annual Rathore Samaj E-Booklet', 'वार्षिक राठौर समाज ई-पुस्तिका')}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-light">
            {t(
              'Flip through the digitized pages of our community directory, just like the traditional printed book handed out by samiti adhyaksh.',
              'हमारी समाज निर्देशिका के डिजिटल पृष्ठों को ठीक वैसे ही पढ़ें जैसे समिति अध्यक्ष द्वारा वितरित पारंपरिक मुद्रित पुस्तक।'
            )}
          </p>
        </div>

        {/* HERO E-BOOK CARD */}
        <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] text-white border border-amber-500/30 rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-lg text-amber-100">
              {t('Rathore Samaj Patrika 2026 (Digital Edition)', 'राठौर समाज पत्रिका 2026 (डिजिटल संस्करण)')}
            </h4>
            <p className="text-xs text-stone-300 font-light">
              {t(
                'Contains 450+ Matrimonial Profiles & 120 Local Business Sponsor Ads',
                '450+ वैवाहिक बायोडाटा एवं 120 स्थानीय समाज व्यापार विज्ञापन सम्मिलित'
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            {config.allowGuestDownloads ? (
              <button 
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-60 text-stone-950 text-xs font-bold px-5 py-2.5 rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer"
              >
                {downloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    {t('Generating PDF (45 MB)...', 'PDF तैयार हो रही है (45 MB)...')}
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                    {t('PDF Downloaded!', 'PDF डाउनलोड हो गई!')}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    {t('Download Printable PDF', 'प्रिंट करने योग्य PDF डाउनलोड करें')}
                  </>
                )}
              </button>
            ) : (
              <span className="bg-white/10 border border-white/20 text-stone-300 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                {t('PDF Downloads Paused by Admin (Read Online Below)', 'PDF डाउनलोड एडमिन द्वारा रोका गया है (नीचे ऑनलाइन पढ़ें)')}
              </span>
            )}

            <button 
              onClick={() => onNavigateTab('matrimony')} 
              className="bg-white/10 hover:bg-white/20 border border-amber-400/30 text-amber-200 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-400" /> {t('Search Digitized Records', 'डिजिटल बायोडाटा खोजें')}
            </button>
          </div>
        </div>

        {/* INTERACTIVE BOOKLET READER VIEWPORT */}
        <div className="border border-amber-300/80 rounded-2xl overflow-hidden bg-amber-50/30 p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-red-950 text-sm">
                📖 {t('Page', 'पृष्ठ')} {currentPage + 1} {t('of', '/')} {BOOKLET_PAGES.length}
              </span>
              <span className="text-[11px] bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded-md font-semibold">
                {pageData.title.split('-')[0]}
              </span>
            </div>

            {/* Quick Page Jump Buttons */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {BOOKLET_PAGES.map((p, idx) => (
                <button
                  key={p.page}
                  onClick={() => setCurrentPage(idx)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    currentPage === idx
                      ? 'bg-red-900 text-amber-100 font-bold shadow-xs'
                      : 'bg-white border border-amber-200 text-slate-700 hover:bg-amber-100'
                  }`}
                >
                  {t('Pg', 'पृ.')} {p.page}
                </button>
              ))}
            </div>
          </div>

          {/* BOOKLET PAGE CONTAINER (PAPER STYLING) */}
          <div className="bg-amber-50/80 border-2 border-amber-300 rounded-xl p-6 md:p-10 shadow-inner min-h-[380px] flex flex-col justify-between relative">
            <div className="space-y-4">
              <div className="border-b-2 border-red-900/20 pb-3 text-center sm:text-left">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-red-950">
                  {pageData.title}
                </h3>
                <p className="text-xs font-semibold text-amber-800 mt-0.5">
                  {pageData.subtitle}
                </p>
              </div>

              <div className="space-y-2.5 py-2">
                {pageData.content.map((line, idx) => (
                  <p key={idx} className="text-xs md:text-sm text-slate-800 leading-relaxed font-sans">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-amber-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
              <span className="italic text-[11px] text-amber-900 font-medium">
                💡 {pageData.note}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-lg border border-amber-300 disabled:opacity-40 hover:bg-amber-200/50 text-red-950 flex items-center gap-1 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4" /> {t('Previous', 'पिछला')}
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(BOOKLET_PAGES.length - 1, currentPage + 1))}
                  disabled={currentPage === BOOKLET_PAGES.length - 1}
                  className="p-1.5 rounded-lg border border-amber-300 disabled:opacity-40 hover:bg-amber-200/50 text-red-950 flex items-center gap-1 text-xs font-bold"
                >
                  {t('Next', 'अगला')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


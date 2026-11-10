import React, { useState } from 'react';
import { 
  ShieldCheck, Users, Store, BookOpen, Calendar, 
  UserPlus, PlusCircle, Menu, X, UserCheck, LogOut, Crown, HeartHandshake,
  LayoutDashboard, Compass, ClipboardList, Languages
} from 'lucide-react';
import { TabType, AuthSession } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  authSession: AuthSession | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, authSession, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const handleTabClick = (tab: TabType) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#6e1628] via-[#851834] to-[#6e1628] text-white shadow-lg border-b border-amber-400/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Auspicious Marriage Crest */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group select-none" 
            onClick={() => handleTabClick('matrimony')}
          >
            <div className="relative">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-[#4c0d1b] font-bold flex items-center justify-center text-lg sm:text-xl shadow-md border-2 border-amber-200/90 group-hover:scale-105 transition-transform font-serif shrink-0">
                RR
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-tr from-amber-400 to-amber-200 rounded-full border border-amber-100 flex items-center justify-center text-[#4c0d1b] shadow-xs">
                <Crown className="w-3 h-3 fill-[#4c0d1b]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-amber-50 font-serif flex items-center gap-1.5">
                  {t('Rathore Rishtey', 'राठौड़ रिश्ते')}
                </h1>
                <ShieldCheck className="w-4 h-4 text-amber-300 fill-amber-300/20 shrink-0" />
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-200/85 font-medium tracking-wide flex items-center gap-1">
                <span className="text-amber-300 font-serif font-semibold">
                  {t('Shubh Vivah', 'शुभ विवाह')}
                </span> • {t('Digital Matrimonial & Business Directory', 'डिजिटल वैवाहिक एवं व्यापार निर्देशिका')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            <button 
              onClick={() => handleTabClick('matrimony')} 
              className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all ${
                currentTab === 'matrimony' 
                  ? 'text-amber-200 font-semibold bg-white/12 shadow-xs' 
                  : 'text-rose-100 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{t('Matrimony Bios', 'वैवाहिक बायोडाटा')}</span>
              {currentTab === 'matrimony' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 rounded-full" />
              )}
            </button>

            <button 
              onClick={() => handleTabClick('kundali')} 
              className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all ${
                currentTab === 'kundali' 
                  ? 'text-amber-200 font-semibold bg-white/12 shadow-xs' 
                  : 'text-rose-100 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{t('Kundali Milan', 'कुंडली मिलान')}</span>
              <span className="text-[10px] bg-amber-400 text-stone-950 font-extrabold px-1.5 py-0.2 rounded-md">
                {t('36 Gunas', '३६ गुण')}
              </span>
              {currentTab === 'kundali' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 rounded-full" />
              )}
            </button>

            <button 
              onClick={() => handleTabClick('guest-list')} 
              className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all ${
                currentTab === 'guest-list' 
                  ? 'text-amber-200 font-semibold bg-white/12 shadow-xs' 
                  : 'text-rose-100 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{t('Guest List', 'अतिथि सूची')}</span>
              <span className="text-[10px] bg-rose-500/80 text-white font-bold px-1.5 py-0.2 rounded-md">
                {t('Planner', 'प्लानर')}
              </span>
              {currentTab === 'guest-list' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 rounded-full" />
              )}
            </button>

            <button 
              onClick={() => handleTabClick('directory')} 
              className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all ${
                currentTab === 'directory' 
                  ? 'text-amber-200 font-semibold bg-white/12 shadow-xs' 
                  : 'text-rose-100 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Store className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{t('Business Ads', 'व्यापार निर्देशिका')}</span>
              {currentTab === 'directory' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 rounded-full" />
              )}
            </button>

            <button 
              onClick={() => handleTabClick('booklet')} 
              className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all ${
                currentTab === 'booklet' 
                  ? 'text-amber-200 font-semibold bg-white/12 shadow-xs' 
                  : 'text-rose-100 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{t('E-Book', 'ई-पत्रिका')}</span>
              {currentTab === 'booklet' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 rounded-full" />
              )}
            </button>

            <button 
              onClick={() => handleTabClick('events')} 
              className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all ${
                currentTab === 'events' 
                  ? 'text-amber-200 font-semibold bg-white/12 shadow-xs' 
                  : 'text-rose-100 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{t('Events', 'कार्यक्रम')}</span>
              {currentTab === 'events' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 rounded-full" />
              )}
            </button>

            {/* ONLY WHEN SIGNED IN: SHOW DASHBOARD, CREATE PROFILE, FAMILY DETAILS AND ADVERTISE SHOP TABS */}
            {authSession && (
              <>
                <div className="h-5 w-px bg-amber-400/30 mx-1"></div>
                
                <button 
                  onClick={() => handleTabClick('dashboard')} 
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    currentTab === 'dashboard' 
                      ? 'bg-amber-300 text-[#4c0d1b] border-amber-200 shadow-sm font-bold' 
                      : 'border-amber-300/40 text-amber-100 hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> {t('Dashboard', 'डैशबोर्ड')}
                </button>

                <button 
                  onClick={() => handleTabClick('create-profile')} 
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    currentTab === 'create-profile' 
                      ? 'bg-amber-300 text-[#4c0d1b] border-amber-200 shadow-sm font-bold' 
                      : 'border-amber-300/40 text-amber-100 hover:bg-white/10'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" /> {t('Create Profile', 'बायोडाटा बनाएं')}
                </button>

                <button 
                  onClick={() => handleTabClick('family-details')} 
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    currentTab === 'family-details' 
                      ? 'bg-amber-300 text-[#4c0d1b] border-amber-200 shadow-sm font-bold' 
                      : 'border-amber-300/40 text-amber-100 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> {t('Family Details', 'पारिवारिक विवरण')}
                </button>

                <button 
                  onClick={() => handleTabClick('advertise-shop')} 
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    currentTab === 'advertise-shop' 
                      ? 'bg-amber-300 text-[#4c0d1b] border-amber-200 shadow-sm font-bold' 
                      : 'border-amber-300/40 text-amber-100 hover:bg-white/10'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" /> {t('Advertise Shop', 'दुकान विज्ञापन')}
                </button>
              </>
            )}
          </nav>

          {/* Language Switcher & Account Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Hindi / English Language Switcher */}
            <div 
              className="flex items-center bg-black/25 border border-amber-400/40 rounded-xl p-0.5 text-[11px] font-bold shadow-inner"
              role="group"
              aria-label="Language Switcher"
            >
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-amber-300 text-[#4c0d1b] shadow-xs'
                    : 'text-amber-100 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-amber-300 text-[#4c0d1b] shadow-xs'
                    : 'text-amber-100 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>

            {authSession ? (
              <div className="flex items-center gap-2">
                {authSession.username === 'AdminAbhi' && (
                  <button
                    onClick={() => handleTabClick('admin')}
                    title={t('Open Admin Dashboard', 'एडमिन डैशबोर्ड खोलें')}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      currentTab === 'admin'
                        ? 'bg-amber-300 text-[#4c0d1b] border-amber-200 shadow-sm'
                        : 'bg-black/30 text-amber-200 border-amber-400/30 hover:bg-black/45'
                    }`}
                  >
                    <span>{t('Admin Dashboard', 'एडमिन डैशबोर्ड')}</span>
                  </button>
                )}

                <button
                  onClick={() => handleTabClick('dashboard')}
                  title={t('Open Member Dashboard', 'सदस्य डैशबोर्ड खोलें')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    currentTab === 'dashboard'
                      ? 'bg-amber-300 text-[#4c0d1b] border-amber-200 shadow-sm'
                      : 'bg-white/10 text-amber-100 hover:bg-white/15 border-amber-400/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="max-w-[110px] truncate">{authSession.name || `+91 ${authSession.phone}`}</span>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title={t('Sign Out', 'लॉगआउट')}
                    className="p-2 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => handleTabClick('signup')} 
                className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#4c0d1b] font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-lg hover:scale-102 shrink-0"
              >
                <UserPlus className="w-4 h-4" /> {t('Sign In / Register', 'लॉगिन / रजिस्टर')}
              </button>
            )}
          </div>

          {/* Mobile: Quick Language Switcher + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <div 
              className="flex items-center bg-black/25 border border-amber-400/40 rounded-xl p-0.5 text-[11px] font-bold"
              role="group"
              aria-label="Mobile Language Switcher"
            >
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-amber-300 text-[#4c0d1b]'
                    : 'text-amber-100'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-amber-300 text-[#4c0d1b]'
                    : 'text-amber-100'
                }`}
              >
                हिंदी
              </button>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#591220] border-t border-amber-400/30 px-4 pt-3 pb-5 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between bg-black/20 px-3 py-2 rounded-xl border border-amber-400/20 mb-2">
            <span className="text-xs text-amber-200 flex items-center gap-1.5 font-semibold">
              <Languages className="w-4 h-4 text-amber-300" />
              {t('App Language', 'ऐप की भाषा')}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  lang === 'en' ? 'bg-amber-300 text-[#4c0d1b]' : 'bg-white/10 text-amber-100'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  lang === 'hi' ? 'bg-amber-300 text-[#4c0d1b]' : 'bg-white/10 text-amber-100'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          <button 
            onClick={() => handleTabClick('matrimony')} 
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2.5 ${
              currentTab === 'matrimony' ? 'bg-amber-300 text-[#4c0d1b] font-bold' : 'text-rose-100'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-amber-300" /> {t('Matrimony Bios', 'वैवाहिक बायोडाटा')}
          </button>
          <button 
            onClick={() => handleTabClick('kundali')} 
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-between ${
              currentTab === 'kundali' ? 'bg-amber-300 text-[#4c0d1b] font-bold' : 'text-rose-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-amber-300" /> {t('Kundali Milan', 'कुंडली मिलान')}
            </span>
            <span className="text-[10px] bg-amber-400 text-stone-950 font-extrabold px-1.5 py-0.2 rounded-md">
              {t('36 Gunas', '३६ गुण')}
            </span>
          </button>
          <button 
            onClick={() => handleTabClick('guest-list')} 
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-between ${
              currentTab === 'guest-list' ? 'bg-amber-300 text-[#4c0d1b] font-bold' : 'text-rose-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ClipboardList className="w-4 h-4 text-amber-300" /> {t('Guest List Planner', 'अतिथि सूची प्लानर')}
            </span>
            <span className="text-[10px] bg-rose-500/80 text-white font-bold px-1.5 py-0.2 rounded-md">
              {t('Planner', 'प्लानर')}
            </span>
          </button>
          <button 
            onClick={() => handleTabClick('directory')} 
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2.5 ${
              currentTab === 'directory' ? 'bg-amber-300 text-[#4c0d1b] font-bold' : 'text-rose-100'
            }`}
          >
            <Store className="w-4 h-4 text-amber-300" /> {t('Business Directory & Ads', 'व्यापार निर्देशिका एवं विज्ञापन')}
          </button>
          <button 
            onClick={() => handleTabClick('booklet')} 
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2.5 ${
              currentTab === 'booklet' ? 'bg-amber-300 text-[#4c0d1b] font-bold' : 'text-rose-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-300" /> {t('Digital E-Book Directory', 'डिजिटल ई-पत्रिका निर्देशिका')}
          </button>
          <button 
            onClick={() => handleTabClick('events')} 
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2.5 ${
              currentTab === 'events' ? 'bg-amber-300 text-[#4c0d1b] font-bold' : 'text-rose-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-300" /> {t('Samaj Events & News', 'समाज कार्यक्रम एवं समाचार')}
          </button>

          {/* Member actions in mobile menu if logged in */}
          {authSession ? (
            <div className="pt-2 border-t border-rose-900/60 space-y-2">
              <div className="px-3 py-2 bg-black/20 rounded-xl text-xs text-amber-200 flex items-center justify-between">
                <span className="truncate">👤 {authSession.name || `+91 ${authSession.phone}`}</span>
                <span className="text-[10px] bg-emerald-700/60 text-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  {t('Verified', 'सत्यापित')}
                </span>
              </div>
              <button 
                onClick={() => handleTabClick('dashboard')} 
                className="w-full bg-gradient-to-r from-amber-300 to-amber-400 text-[#4c0d1b] font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 shadow"
              >
                <LayoutDashboard className="w-4 h-4" /> {t('Member Dashboard', 'सदस्य डैशबोर्ड')}
              </button>
              {authSession.username === 'AdminAbhi' && (
                <button 
                  onClick={() => handleTabClick('admin')} 
                  className="w-full bg-amber-400/20 border border-amber-300/50 text-amber-100 font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5"
                >
                  <span>{t('Open Admin Dashboard (AdminAbhi)', 'एडमिन डैशबोर्ड खोलें (AdminAbhi)')}</span>
                </button>
              )}
              <button 
                onClick={() => handleTabClick('create-profile')} 
                className="w-full bg-rose-900/70 border border-amber-300/30 text-amber-100 font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> {t('Create Matrimonial Profile', 'वैवाहिक प्रोफ़ाइल बनाएं')}
              </button>
              <button 
                onClick={() => handleTabClick('family-details')} 
                className="w-full bg-rose-900/70 border border-amber-300/30 text-amber-100 font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5"
              >
                <Users className="w-4 h-4 text-amber-300" /> {t('Add Family Details', 'पारिवारिक विवरण जोड़ें')}
              </button>
              <button 
                onClick={() => handleTabClick('advertise-shop')} 
                className="w-full bg-rose-900/70 border border-amber-300/30 text-amber-100 font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5"
              >
                <Store className="w-4 h-4 text-amber-300" /> {t('Advertise Shop', 'दुकान का विज्ञापन करें')}
              </button>
              {onLogout && (
                <button 
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }} 
                  className="w-full text-rose-300 hover:text-white py-2 text-xs text-center flex items-center justify-center gap-1.5 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> {t('Sign Out', 'लॉगआउट')}
                </button>
              )}
            </div>
          ) : (
            <div className="pt-2 border-t border-rose-900/60">
              <button 
                onClick={() => handleTabClick('signup')} 
                className="w-full bg-gradient-to-r from-amber-300 to-amber-400 text-[#4c0d1b] font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 shadow"
              >
                <UserPlus className="w-4 h-4" /> {t('Sign In / Register', 'लॉगिन / रजिस्टर')}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

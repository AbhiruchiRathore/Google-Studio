import React, { useState } from 'react';
import { 
  ShieldCheck, Users, Store, BookOpen, Calendar, 
  UserPlus, PlusCircle, Menu, X, UserCheck, LogOut, Crown, Sparkles 
} from 'lucide-react';
import { TabType, AuthSession } from '../types';

interface HeaderProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  authSession: AuthSession | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, authSession, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: TabType) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] text-white shadow-xl border-b border-amber-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Royal Crest */}
          <div 
            className="flex items-center space-x-3.5 cursor-pointer group select-none" 
            onClick={() => handleTabClick('matrimony')}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-[#2a060d] font-bold flex items-center justify-center text-xl shadow-md border border-amber-200/80 group-hover:scale-105 transition-transform font-serif shrink-0">
                RR
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 rounded-full border border-amber-200 flex items-center justify-center text-[#2a060d] shadow-xs">
                <Crown className="w-3 h-3 fill-[#2a060d]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-amber-50 font-serif">
                  Rathore Rishtey
                </h1>
                <ShieldCheck className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              </div>
              <p className="text-[11px] text-amber-300/80 font-medium tracking-wide">
                डिजिटल वैवाहिक एवं व्यापार निर्देशिका
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            <button 
              onClick={() => handleTabClick('matrimony')} 
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                currentTab === 'matrimony' 
                  ? 'text-amber-300 font-semibold bg-white/10 shadow-xs' 
                  : 'text-stone-300 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Matrimony Bios</span>
              {currentTab === 'matrimony' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300 rounded-full" />
              )}
            </button>

            <button 
              onClick={() => handleTabClick('directory')} 
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                currentTab === 'directory' 
                  ? 'text-amber-300 font-semibold bg-white/10 shadow-xs' 
                  : 'text-stone-300 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>Business Ads</span>
              {currentTab === 'directory' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300 rounded-full" />
              )}
            </button>

            <button 
              onClick={() => handleTabClick('booklet')} 
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                currentTab === 'booklet' 
                  ? 'text-amber-300 font-semibold bg-white/10 shadow-xs' 
                  : 'text-stone-300 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Digital E-Book</span>
              {currentTab === 'booklet' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300 rounded-full" />
              )}
            </button>

            <button 
              onClick={() => handleTabClick('events')} 
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                currentTab === 'events' 
                  ? 'text-amber-300 font-semibold bg-white/10 shadow-xs' 
                  : 'text-stone-300 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Samaj Events</span>
              {currentTab === 'events' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300 rounded-full" />
              )}
            </button>

            {/* ONLY WHEN SIGNED IN: SHOW CREATE PROFILE AND ADVERTISE SHOP TABS */}
            {authSession && (
              <>
                <div className="h-5 w-px bg-amber-500/30 mx-1"></div>
                
                <button 
                  onClick={() => handleTabClick('create-profile')} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    currentTab === 'create-profile' 
                      ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-sm' 
                      : 'border-amber-400/40 text-amber-200 hover:bg-amber-400/10'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Create Profile
                </button>

                <button 
                  onClick={() => handleTabClick('family-details')} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    currentTab === 'family-details' 
                      ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-sm' 
                      : 'border-amber-400/40 text-amber-200 hover:bg-amber-400/10'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Family Details
                </button>

                <button 
                  onClick={() => handleTabClick('advertise-shop')} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    currentTab === 'advertise-shop' 
                      ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-sm' 
                      : 'border-amber-400/40 text-amber-200 hover:bg-amber-400/10'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" /> Advertise Shop
                </button>
              </>
            )}
          </nav>

          {/* SINGLE SIGN UP / ACCOUNT BUTTON (No duplicate) */}
          <div className="hidden md:flex items-center space-x-3">
            {authSession ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTabClick('signup')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    currentTab === 'signup'
                      ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-sm'
                      : 'bg-white/10 text-amber-100 hover:bg-white/15 border-amber-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="max-w-[120px] truncate">{authSession.name || `+91 ${authSession.phone}`}</span>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => handleTabClick('signup')} 
                className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer hover:shadow-lg hover:scale-102"
              >
                <UserPlus className="w-4 h-4" /> Sign In / Sign Up
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
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
        <div className="md:hidden bg-[#1f0409] border-t border-amber-500/30 px-4 pt-3 pb-5 space-y-2 shadow-2xl">
          <button 
            onClick={() => handleTabClick('matrimony')} 
            className={`w-full text-left px-3.5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2.5 ${
              currentTab === 'matrimony' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-200'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" /> Matrimony Bios
          </button>
          <button 
            onClick={() => handleTabClick('directory')} 
            className={`w-full text-left px-3.5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2.5 ${
              currentTab === 'directory' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-200'
            }`}
          >
            <Store className="w-4 h-4 text-amber-400" /> Business Directory & Ads
          </button>
          <button 
            onClick={() => handleTabClick('booklet')} 
            className={`w-full text-left px-3.5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2.5 ${
              currentTab === 'booklet' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" /> Digital E-Book Directory
          </button>
          <button 
            onClick={() => handleTabClick('events')} 
            className={`w-full text-left px-3.5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2.5 ${
              currentTab === 'events' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" /> Samaj Events & News
          </button>

          {/* VISIBLE ONLY AFTER USER SIGNS IN */}
          {authSession ? (
            <div className="pt-3 space-y-2 border-t border-amber-800/60">
              <span className="text-[10px] text-amber-300/70 uppercase tracking-wider font-bold px-3">
                Member Controls
              </span>
              <button 
                onClick={() => handleTabClick('create-profile')} 
                className={`w-full text-left px-3.5 py-2 rounded-lg font-medium text-sm flex items-center gap-2.5 ${
                  currentTab === 'create-profile' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-amber-200 bg-white/5'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-amber-400" /> Create Profile
              </button>
              <button 
                onClick={() => handleTabClick('family-details')} 
                className={`w-full text-left px-3.5 py-2 rounded-lg font-medium text-sm flex items-center gap-2.5 ${
                  currentTab === 'family-details' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-amber-200 bg-white/5'
                }`}
              >
                <Users className="w-4 h-4 text-amber-400" /> Add Family Details
              </button>
              <button 
                onClick={() => handleTabClick('advertise-shop')} 
                className={`w-full text-left px-3.5 py-2 rounded-lg font-medium text-sm flex items-center gap-2.5 ${
                  currentTab === 'advertise-shop' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-amber-200 bg-white/5'
                }`}
              >
                <Store className="w-4 h-4 text-amber-400" /> Advertise Shop
              </button>
              <button 
                onClick={() => handleTabClick('signup')} 
                className={`w-full text-left px-3.5 py-2 rounded-lg font-medium text-sm flex items-center gap-2.5 ${
                  currentTab === 'signup' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-200'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-400" /> My Account ({authSession.name || authSession.phone})
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-amber-800/60">
              <button 
                onClick={() => handleTabClick('signup')} 
                className="w-full bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 font-bold py-2.5 rounded-lg text-xs text-center flex items-center justify-center gap-2 shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> Sign In / Sign Up
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};


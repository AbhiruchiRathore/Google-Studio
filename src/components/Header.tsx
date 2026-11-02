import React, { useState } from 'react';
import { ShieldCheck, Users, Store, BookOpen, Calendar, UserPlus, PlusCircle, Menu, X, UserCheck, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 text-white shadow-xl border-b-2 border-amber-500/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Branding Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => handleTabClick('matrimony')}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-red-950 font-bold flex items-center justify-center text-xl shadow-lg border-2 border-amber-300 group-hover:scale-105 transition-transform font-serif shrink-0">
              RR
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide text-amber-100 flex items-center gap-1.5 font-serif">
                Rathore Rishtey
                <ShieldCheck className="w-5 h-5 text-amber-300 fill-amber-300/20 inline" />
              </h1>
              <p className="text-[11px] sm:text-xs text-amber-200/80 font-medium">Digital Matrimony & Business Directory</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 lg:space-x-1.5 items-center">
            <button 
              onClick={() => handleTabClick('matrimony')} 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                currentTab === 'matrimony' 
                  ? 'bg-amber-500 text-red-950 shadow-md font-bold' 
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" /> Matrimony Bios
            </button>

            <button 
              onClick={() => handleTabClick('directory')} 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                currentTab === 'directory' 
                  ? 'bg-amber-500 text-red-950 shadow-md font-bold' 
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              <Store className="w-4 h-4" /> Business Ads
            </button>

            <button 
              onClick={() => handleTabClick('booklet')} 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                currentTab === 'booklet' 
                  ? 'bg-amber-500 text-red-950 shadow-md font-bold' 
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Digital E-Book
            </button>

            <button 
              onClick={() => handleTabClick('events')} 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                currentTab === 'events' 
                  ? 'bg-amber-500 text-red-950 shadow-md font-bold' 
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4" /> Samaj Events
            </button>

            {/* TABS REVEALED AFTER USER SIGNS IN */}
            {authSession && (
              <>
                <button 
                  onClick={() => handleTabClick('create-profile')} 
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all border border-amber-400/30 ${
                    currentTab === 'create-profile' 
                      ? 'bg-amber-400 text-red-950 shadow-md font-bold' 
                      : 'bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-amber-300" /> Create Profile
                </button>

                <button 
                  onClick={() => handleTabClick('advertise-shop')} 
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all border border-amber-400/30 ${
                    currentTab === 'advertise-shop' 
                      ? 'bg-amber-400 text-red-950 shadow-md font-bold' 
                      : 'bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                  }`}
                >
                  <Store className="w-4 h-4 text-amber-300" /> Advertise Business
                </button>
              </>
            )}

            <button 
              onClick={() => handleTabClick('signup')} 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                currentTab === 'signup' 
                  ? 'bg-amber-500 text-red-950 shadow-md font-bold' 
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              {authSession ? (
                <>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>My Account</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </>
              )}
            </button>
          </nav>

          {/* Quick Action CTA or User Indicator */}
          <div className="hidden lg:flex items-center space-x-3">
            {authSession ? (
              <div className="flex items-center gap-2 bg-black/20 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-amber-100 font-medium">
                  {authSession.name || `+91 ${authSession.phone}`}
                </span>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="text-amber-200/70 hover:text-white ml-1 p-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => handleTabClick('signup')} 
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-red-950 font-bold px-4 py-2 rounded-lg text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Sign In to Post
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 rounded-md text-amber-200 hover:text-white hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-red-950 border-t border-amber-500/30 px-4 pt-2 pb-4 space-y-2">
          <button 
            onClick={() => handleTabClick('matrimony')} 
            className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm flex items-center gap-2 ${
              currentTab === 'matrimony' ? 'bg-amber-500 text-red-950 font-bold' : 'text-amber-100'
            }`}
          >
            <Users className="w-4 h-4" /> Matrimony Bios
          </button>
          <button 
            onClick={() => handleTabClick('directory')} 
            className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm flex items-center gap-2 ${
              currentTab === 'directory' ? 'bg-amber-500 text-red-950 font-bold' : 'text-amber-100'
            }`}
          >
            <Store className="w-4 h-4" /> Business Directory & Ads
          </button>
          <button 
            onClick={() => handleTabClick('booklet')} 
            className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm flex items-center gap-2 ${
              currentTab === 'booklet' ? 'bg-amber-500 text-red-950 font-bold' : 'text-amber-100'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Digital E-Book Directory
          </button>
          <button 
            onClick={() => handleTabClick('events')} 
            className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm flex items-center gap-2 ${
              currentTab === 'events' ? 'bg-amber-500 text-red-950 font-bold' : 'text-amber-100'
            }`}
          >
            <Calendar className="w-4 h-4" /> Samaj Events & News
          </button>

          {/* TABS VISIBLE ONLY AFTER SIGN IN (MOBILE) */}
          {authSession ? (
            <div className="pt-2 space-y-2 border-t border-amber-800/80">
              <span className="text-[10px] text-amber-300/70 uppercase tracking-wider font-bold px-3">
                Member Actions
              </span>
              <button 
                onClick={() => handleTabClick('create-profile')} 
                className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm flex items-center gap-2 ${
                  currentTab === 'create-profile' ? 'bg-amber-500 text-red-950 font-bold' : 'text-amber-200 bg-amber-500/10'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-amber-300" /> Create Profile
              </button>
              <button 
                onClick={() => handleTabClick('advertise-shop')} 
                className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm flex items-center gap-2 ${
                  currentTab === 'advertise-shop' ? 'bg-amber-500 text-red-950 font-bold' : 'text-amber-200 bg-amber-500/10'
                }`}
              >
                <Store className="w-4 h-4 text-amber-300" /> Advertise Business
              </button>
              <button 
                onClick={() => handleTabClick('signup')} 
                className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm flex items-center gap-2 ${
                  currentTab === 'signup' ? 'bg-amber-500 text-red-950 font-bold' : 'text-amber-100'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-400" /> My Account
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-amber-800">
              <button 
                onClick={() => handleTabClick('signup')} 
                className="w-full bg-amber-500 hover:bg-amber-400 text-red-950 font-bold py-2.5 rounded-md text-xs text-center flex items-center justify-center gap-1.5 shadow"
              >
                <UserPlus className="w-4 h-4" /> Sign In to Create Profile or Advertise
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

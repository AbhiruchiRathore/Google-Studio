import React, { useState, useMemo } from 'react';
import { 
  Search, GraduationCap, Briefcase, Eye, Phone, X, ShieldAlert, Sparkles, 
  UserPlus, Lock, ShieldCheck, ArrowRight, Users, Home, Heart, MapPin, 
  MessageCircle, CheckCircle2, ChevronRight, Award
} from 'lucide-react';
import { MatrimonyProfile, GenderType, TabType, AuthSession } from '../types';

interface MatrimonyTabProps {
  authSession: AuthSession | null;
  profiles: MatrimonyProfile[];
  unlockedProfiles: (number | string)[];
  hasRegisteredProfile: boolean;
  onUnlockProfile: (id: number | string) => void;
  onNavigateTab: (tab: TabType) => void;
  onAddQuickProfile: (profile: Partial<MatrimonyProfile>) => void;
}

const FREE_LIMIT = 3;

export const MatrimonyTab: React.FC<MatrimonyTabProps> = ({
  authSession,
  profiles,
  unlockedProfiles,
  hasRegisteredProfile,
  onUnlockProfile,
  onNavigateTab,
  onAddQuickProfile
}) => {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderType>('all');
  const [gotraFilter, setGotraFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // Selected Profile for Biodata Modal
  const [selectedProfileId, setSelectedProfileId] = useState<number | string | null>(null);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.profession && p.profession.toLowerCase().includes(q)) || 
        (p.education && p.education.toLowerCase().includes(q)) ||
        (p.familyDetails && p.familyDetails.toLowerCase().includes(q)) ||
        (p.about && p.about.toLowerCase().includes(q));

      const matchGender = genderFilter === 'all' || p.gender === genderFilter;
      const matchGotra = !gotraFilter.trim() || p.gotra.toLowerCase().includes(gotraFilter.toLowerCase().trim());
      const matchCity = !cityFilter.trim() || p.city.toLowerCase().includes(cityFilter.toLowerCase().trim());

      return matchSearch && matchGender && matchGotra && matchCity;
    });
  }, [profiles, search, genderFilter, gotraFilter, cityFilter]);

  const activeProfile = useMemo(() => {
    if (selectedProfileId === null) return null;
    return profiles.find(p => p.id === selectedProfileId) || null;
  }, [profiles, selectedProfileId]);

  const handleOpenProfile = (id: number | string) => {
    setSelectedProfileId(id);
    const isAlreadyUnlocked = unlockedProfiles.includes(id);
    const hasSlots = unlockedProfiles.length < FREE_LIMIT;
    if (!hasRegisteredProfile && !isAlreadyUnlocked && hasSlots) {
      onUnlockProfile(id);
    }
  };

  const handleCloseModal = () => {
    setSelectedProfileId(null);
  };

  const isProfileAccessible = (id: number | string) => {
    if (hasRegisteredProfile) return true;
    if (unlockedProfiles.includes(id)) return true;
    return unlockedProfiles.length < FREE_LIMIT;
  };

  const remainingFreeContacts = Math.max(0, FREE_LIMIT - unlockedProfiles.length);

  // IF USER IS NOT SIGNED IN: Show gate informing that profiles are visible after signing in
  if (!authSession) {
    return (
      <div className="space-y-8">
        {/* SIGN IN REQUIRED HERO CARD */}
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200/90 overflow-hidden">
          <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] p-8 sm:p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6 border-b border-amber-500/30">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Samaj Privacy & Trust Protection</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
                Sign In to View Matrimony Biodatas
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
                To respect the privacy of Rathore Samaj families and safeguard candidate contact details, biodata records are accessible to verified community members.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('signup')}
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all text-xs sm:text-sm shrink-0 flex items-center gap-2 cursor-pointer hover:scale-102"
            >
              <UserPlus className="w-4 h-4 text-stone-950" />
              <span>Sign In / Register</span>
            </button>
          </div>

          {/* COMMUNITY TRUST PILLARS */}
          <div className="p-6 md:p-8 bg-[#FAF8F5] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-amber-800" />
              </div>
              <h4 className="font-serif font-bold text-sm text-stone-900">100% Samaj Verified</h4>
              <p className="text-stone-600 leading-relaxed">
                Biodatas screened for authentic Gotra lineage, education, and family background across MP, Maharashtra & beyond.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-amber-800" />
              </div>
              <h4 className="font-serif font-bold text-sm text-stone-900">3 Free Direct Contacts</h4>
              <p className="text-stone-600 leading-relaxed">
                Immediately explore and unlock verified phone numbers for up to 3 candidates upon sign-in.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 text-amber-800" />
              </div>
              <h4 className="font-serif font-bold text-sm text-stone-900">Mutual Community Access</h4>
              <p className="text-stone-600 leading-relaxed">
                Contribute your own family details to unlock unlimited biodatas and expand the community directory network.
              </p>
            </div>
          </div>
        </div>

        {/* SAMPLE TEASER CARDS (BLURRED PREVIEW) */}
        <div className="relative">
          <div className="absolute inset-0 z-10 backdrop-blur-xs bg-stone-900/30 flex flex-col items-center justify-center p-6 rounded-3xl border border-amber-400/40 shadow-2xl text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-[#380812] to-[#24050b] text-amber-300 rounded-2xl flex items-center justify-center shadow-lg border border-amber-400/40">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white drop-shadow-sm">
              450+ Verified Samaj Biodatas
            </h3>
            <p className="text-xs sm:text-sm text-stone-200 max-w-md drop-shadow-sm font-light">
              Sign in with your Google account or mobile number to view verified candidate photos, educational credentials, and direct family contact numbers.
            </p>
            <button
              onClick={() => onNavigateTab('signup')}
              className="bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            >
              <span>Unlock Directory Access</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Blurred Background Mock Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 filter blur-xs select-none pointer-events-none">
            {profiles.slice(0, 4).map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-6 border border-stone-200 flex gap-5">
                <div className="w-28 h-28 bg-stone-200 rounded-xl"></div>
                <div className="space-y-2.5 flex-1">
                  <div className="h-5 bg-stone-300 rounded w-3/4"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                  <div className="h-4 bg-stone-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // IF USER IS SIGNED IN: Full profiles view
  return (
    <div className="space-y-6">
      {/* SEARCH & FILTERS SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/90 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          
          {/* Search bar */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, qualification, profession..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm bg-stone-50/50 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Gender Segmented Switch */}
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/80">
              <button
                onClick={() => setGenderFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  genderFilter === 'all'
                    ? 'bg-[#380812] text-amber-200 shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                All (समस्त)
              </button>
              <button
                onClick={() => setGenderFilter('Male')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  genderFilter === 'Male'
                    ? 'bg-[#380812] text-amber-200 shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                Grooms (वर)
              </button>
              <button
                onClick={() => setGenderFilter('Female')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  genderFilter === 'Female'
                    ? 'bg-[#380812] text-amber-200 shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                Brides (वधु)
              </button>
            </div>

            {/* Gotra Filter */}
            <input
              type="text"
              value={gotraFilter}
              onChange={(e) => setGotraFilter(e.target.value)}
              placeholder="Filter Gotra (गोत्र)..."
              className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-stone-50/50"
            />

            {/* City Filter */}
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filter City (शहर)..."
              className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-stone-50/50"
            />
          </div>
        </div>

        {/* Counter & Action - CLICK TO GO TO SEPARATE ADD FAMILY DETAILS PAGE */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-stone-500 pt-3 border-t border-stone-100 gap-2">
          <span className="font-medium text-stone-600">
            Showing <strong className="text-stone-900">{filteredProfiles.length}</strong> verified Rathore Samaj Biodatas
          </span>
          <button 
            type="button"
            className="text-[#380812] hover:text-[#540e1b] font-semibold cursor-pointer flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/70 px-3.5 py-1.5 rounded-xl border border-amber-300/60 transition-colors"
            onClick={() => onNavigateTab('family-details')}
          >
            <Users className="w-3.5 h-3.5 text-amber-800" />
            <span>+ Click to register family details (Open Dedicated Page)</span>
          </button>
        </div>
      </div>

      {/* UNREGISTERED FAMILY BANNER PROMPT */}
      {!hasRegisteredProfile && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/40 to-stone-50 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3 text-[#380812]">
            <div className="w-8 h-8 rounded-full bg-amber-200/80 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-900" />
            </div>
            <div>
              <p className="font-bold text-stone-900">Unlock Unlimited Community Contacts</p>
              <p className="text-stone-600">
                You have <strong>{remainingFreeContacts} of 3 free view unlocks</strong> remaining. Register your family details to browse without limits!
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('family-details')}
            className="bg-[#380812] hover:bg-[#540e1b] text-amber-200 font-semibold px-4 py-2 rounded-xl text-xs shrink-0 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>Go to Add Family Details Page</span>
          </button>
        </div>
      )}

      {/* MATRIMONY CARDS GRID */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/90 p-12 text-center text-stone-500">
          <p className="text-base font-serif font-bold text-stone-800">No profiles found matching your search filters.</p>
          <p className="text-xs text-stone-500 mt-1">Try clearing your search keyword, gotra, or city filter.</p>
          <button
            onClick={() => { setSearch(''); setGenderFilter('all'); setGotraFilter(''); setCityFilter(''); }}
            className="mt-4 bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer hover:scale-102 transition-transform"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProfiles.map((p) => {
            const photoUrl = p.photo && p.photo.trim() !== '' 
              ? p.photo 
              : p.gender === 'Female'
                ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";

            return (
              <div 
                key={p.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-200/80 hover:border-amber-400/50 overflow-hidden flex flex-col sm:flex-row group"
              >
                {/* Photo Column */}
                <div className="sm:w-2/5 relative h-64 sm:h-auto bg-stone-100 overflow-hidden shrink-0">
                  <img 
                    src={photoUrl} 
                    alt={p.name} 
                    className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = p.gender === 'Female'
                        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                  {/* Verified Badge */}
                  <div className="absolute top-3 left-3 bg-[#24050b]/90 text-amber-300 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm border border-amber-500/30 flex items-center gap-1 backdrop-blur-xs">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>Gotra: {p.gotra}</span>
                  </div>
                </div>

                {/* Content Column */}
                <div className="p-5 sm:w-3/5 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-lg font-serif font-bold text-stone-900 group-hover:text-[#380812] transition-colors leading-snug">
                          {p.name}
                        </h3>
                        {/* ZERO PILL METADATA DISCIPLINE */}
                        <p className="text-xs text-stone-600 font-medium mt-1">
                          {p.age} Yrs · {p.height || "5' 6\""} · {p.city}, {p.state || 'India'}
                        </p>
                      </div>
                    </div>

                    {/* Education & Profession */}
                    <div className="mt-4 space-y-2 text-xs text-stone-600">
                      {p.education && p.education.trim() !== '' && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-amber-700 shrink-0" />
                          <span className="line-clamp-1 font-medium text-stone-700">{p.education}</span>
                        </div>
                      )}
                      {p.profession && p.profession.trim() !== '' && p.profession !== '---' && p.profession !== 'Not specified' && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-amber-700 shrink-0" />
                          <span className="line-clamp-1 font-medium text-stone-700">{p.profession}</span>
                        </div>
                      )}
                      {p.income && p.income.trim() !== '' && p.income !== '---' && p.income !== 'Not specified' && (
                        <div className="text-[11px] text-emerald-800 font-semibold pl-6">
                          Income: {p.income}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenProfile(p.id)}
                      className="flex-1 bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 text-xs font-semibold py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-500/20"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>View Full Biodata</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL BIODATA DETAIL MODAL */}
      {activeProfile && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-amber-300/80 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseModal} 
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {isProfileAccessible(activeProfile.id) ? (
              <div className="space-y-4">
                {/* Traditional Sacred Heading */}
                <div className="text-center pb-2 border-b border-stone-100">
                  <p className="text-[11px] font-serif text-amber-800 font-medium tracking-widest">
                    ॥ शुभ विवाह • वर-वधु परिचय पत्र ॥
                  </p>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between bg-amber-50/80 p-2.5 rounded-xl text-xs font-semibold text-amber-950 border border-amber-200/60">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>{hasRegisteredProfile ? 'Status: Unlocked (Family Details Registered)' : `Free Contacts Left: ${remainingFreeContacts}`}</span>
                  </span>
                  <span className="text-stone-500 hidden sm:inline text-[11px]">Rathore Samaj Verified</span>
                </div>

                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start pt-1">
                  <img 
                    src={activeProfile.photo && activeProfile.photo.trim() !== '' ? activeProfile.photo : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"} 
                    alt={activeProfile.name} 
                    className="w-28 h-28 rounded-2xl object-cover object-top border-2 border-amber-400 shadow-md shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                  <div className="w-full text-center sm:text-left space-y-1">
                    {/* ZERO PILL LINE */}
                    <p className="text-xs text-amber-800 font-semibold tracking-wide">
                      Gotra: {activeProfile.gotra} · {activeProfile.city}, {activeProfile.state || 'India'}
                    </p>

                    <h2 className="text-2xl font-bold font-serif text-stone-900">
                      {activeProfile.name}
                    </h2>
                    <p className="text-xs text-stone-600 font-medium">
                      Age: {activeProfile.age} Yrs {activeProfile.dob ? `(DOB: ${activeProfile.dob})` : ''} · Height: {activeProfile.height || "5' 6\""} · {activeProfile.gender}
                    </p>
                    {activeProfile.income && activeProfile.income.trim() !== '' && activeProfile.income !== '---' && activeProfile.income !== 'Not specified' && (
                      <p className="text-xs text-emerald-800 font-bold">
                        Package / Income: {activeProfile.income}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details box */}
                <div className="space-y-3 border-t border-stone-100 pt-3 text-xs max-h-[48vh] overflow-y-auto pr-1">
                  <div className={`grid grid-cols-1 ${activeProfile.profession && activeProfile.profession.trim() !== '' && activeProfile.profession !== '---' && activeProfile.profession !== 'Not specified' ? 'sm:grid-cols-2' : ''} gap-2.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80`}>
                    <div>
                      <span className="text-stone-500 font-medium">Education:</span>
                      <p className="font-semibold text-stone-800 mt-0.5">{activeProfile.education}</p>
                    </div>
                    {activeProfile.profession && activeProfile.profession.trim() !== '' && activeProfile.profession !== '---' && activeProfile.profession !== 'Not specified' && (
                      <div>
                        <span className="text-stone-500 font-medium">Profession:</span>
                        <p className="font-semibold text-stone-800 mt-0.5">{activeProfile.profession}</p>
                      </div>
                    )}
                  </div>

                  {activeProfile.familyDetails && (
                    <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/60 space-y-1">
                      <span className="text-amber-900 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        Full Family Details (पारिवारिक विवरण):
                      </span>
                      <p className="font-medium text-stone-800 leading-relaxed">{activeProfile.familyDetails}</p>
                    </div>
                  )}

                  {activeProfile.about && (
                    <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 space-y-1">
                      <span className="text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                        Additional Lineage & Notes:
                      </span>
                      <p className="font-medium text-stone-800 leading-relaxed">{activeProfile.about}</p>
                    </div>
                  )}

                  {/* Contact details */}
                  <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                        Verified Contact Numbers:
                      </span>
                      <p className="text-emerald-950 font-extrabold text-sm mt-0.5">{activeProfile.contact}</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a 
                        href={`tel:${activeProfile.contact.split(',')[0].trim()}`} 
                        className="flex-1 sm:flex-initial bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Family
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Free limit reached dialog */
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl mx-auto flex items-center justify-center shadow-inner border border-amber-300">
                  <ShieldAlert className="w-8 h-8 text-amber-800" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-stone-900">Free View Limit Reached</h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                  You have viewed 3 free biodatas. To view unlimited community profiles and support fellow Rathore families, please register your family details on our dedicated page.
                </p>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-left space-y-1.5 max-w-sm mx-auto text-xs">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-700" /> Community Mutual Sharing Policy
                  </p>
                  <p className="text-stone-600 leading-relaxed">
                    By submitting your family details, you keep the Rathore Samaj directory authentic and verified for everyone.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    handleCloseModal();
                    onNavigateTab('family-details');
                  }} 
                  className="w-full max-w-sm mx-auto bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3 rounded-xl shadow-md block text-xs cursor-pointer transition-all border border-amber-400/30"
                >
                  📝 Open Add Family Details Page (Unlock Unlimited Access)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Search, GraduationCap, Briefcase, Eye, Phone, X, ShieldAlert, Sparkles, 
  UserPlus, Lock, ShieldCheck, ArrowRight, Users, Home, Heart 
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
  
  // Register Family Details Modal state
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyForm, setFamilyForm] = useState({
    candidateName: '',
    gender: 'Male' as 'Male' | 'Female',
    age: '26',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: 'Homemaker',
    grandfatherName: '',
    selfGotra: '',
    maternalGotra: '',
    brothers: '',
    sisters: '',
    nativePlace: '',
    currentCity: '',
    familyContact: '',
    kuldevi: '',
    familyBackground: ''
  });

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.profession.toLowerCase().includes(q) || 
        p.education.toLowerCase().includes(q) ||
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

  // Handle Register Family Details submission
  const handleFamilySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!familyForm.fatherName || !familyForm.selfGotra || !familyForm.familyContact || !familyForm.nativePlace) {
      alert("Please fill in Father's Name, Gotra, Native Place, and Family Contact number.");
      return;
    }

    const candidateDisplayName = familyForm.candidateName.trim() || `Son/Daughter of ${familyForm.fatherName}`;
    const familyDetailsSummary = `Father: ${familyForm.fatherName} (${familyForm.fatherOccupation || 'Service/Business'}), Mother: ${familyForm.motherName || 'Smt. Rathore'} (${familyForm.motherOccupation || 'Homemaker'}), Grandfather: ${familyForm.grandfatherName || 'Respected Elder'}. Siblings: ${familyForm.brothers || '0'} brother(s), ${familyForm.sisters || '0'} sister(s). Maternal Gotra: ${familyForm.maternalGotra || 'Kshatriya Rathore'}. Native Place: ${familyForm.nativePlace}.`;

    const aboutFamily = `Maternal (Nanihaal) Gotra: ${familyForm.maternalGotra || 'Not specified'}. Kuldevi: ${familyForm.kuldevi || 'Maa Chamunda / Kuldevi'}. ${familyForm.familyBackground || 'Well-settled respected Rathore Samaj family.'}`;

    onAddQuickProfile({
      name: candidateDisplayName,
      age: Number(familyForm.age) || 26,
      gender: familyForm.gender,
      gotra: familyForm.selfGotra,
      city: familyForm.currentCity || familyForm.nativePlace || 'Indore',
      state: 'Madhya Pradesh',
      native: familyForm.nativePlace,
      location: familyForm.currentCity || familyForm.nativePlace,
      contact: familyForm.familyContact,
      education: 'Graduate / Professional',
      profession: 'Service / Business / Professional',
      income: 'Competitive',
      familyDetails: familyDetailsSummary,
      about: aboutFamily,
      verified: true
    });

    setShowFamilyModal(false);
    setFamilyForm({
      candidateName: '',
      gender: 'Male',
      age: '26',
      fatherName: '',
      fatherOccupation: '',
      motherName: '',
      motherOccupation: 'Homemaker',
      grandfatherName: '',
      selfGotra: '',
      maternalGotra: '',
      brothers: '',
      sisters: '',
      nativePlace: '',
      currentCity: '',
      familyContact: '',
      kuldevi: '',
      familyBackground: ''
    });

    alert("🎉 Family Details Registered Successfully! Your family's details are now published in the Rathore Rishtey directory and you have unlocked unlimited directory views.");
  };

  // IF USER IS NOT SIGNED IN: Show gate informing that profiles are visible after signing in
  if (!authSession) {
    return (
      <div className="space-y-6">
        {/* SIGN IN REQUIRED HERO CARD */}
        <div className="bg-white rounded-3xl shadow-xl border border-amber-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-950 via-rose-950 to-amber-950 p-8 text-white text-center sm:text-left flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="bg-amber-400 text-red-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                Exclusive Community Directory
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                Sign In to View Matrimony Profiles
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                To respect the privacy of Rathore Samaj families and maintain genuine biodata records, community profiles and contact details are visible to signed-in members.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('signup')}
              className="bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-red-950 font-extrabold px-6 py-3.5 rounded-xl shadow-lg transition-all text-xs sm:text-sm shrink-0 flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <UserPlus className="w-5 h-5" /> Sign In to View Profiles
            </button>
          </div>

          {/* PRIVACY & COMMUNITY BENEFITS */}
          <div className="p-6 md:p-8 bg-amber-50/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-900 flex items-center justify-center font-bold mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900">100% Verified Biodatas</h4>
              <p className="text-slate-600">Access verified groom and bride biodatas across MP, Maharashtra & beyond.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900">3 Free Contact Unlocks</h4>
              <p className="text-slate-600">Browse and view full family contact details for up to 3 candidates right away.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold mb-2">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900">Post Profiles & Business Ads</h4>
              <p className="text-slate-600">Once signed in, access the Create Profile and Advertise Shop options in the navigation.</p>
            </div>
          </div>
        </div>

        {/* BLURRED SAMPLE TEASER CARDS */}
        <div className="relative">
          <div className="absolute inset-0 z-10 backdrop-blur-xs bg-amber-50/50 flex flex-col items-center justify-center p-6 rounded-3xl border border-amber-300/60 shadow-lg text-center space-y-3">
            <div className="w-14 h-14 bg-red-950 text-amber-300 rounded-full flex items-center justify-center shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-serif font-bold text-red-950">
              450+ Verified Profiles Locked
            </h3>
            <p className="text-xs text-slate-600 max-w-md">
              Sign in with your Google account or 10-digit mobile number to view names, photos, education, and family details.
            </p>
            <button
              onClick={() => onNavigateTab('signup')}
              className="bg-red-900 hover:bg-red-800 text-amber-100 font-bold px-6 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            >
              Sign Up / Sign In Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Blurred Background Mock Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 filter blur-xs select-none pointer-events-none">
            {profiles.slice(0, 4).map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-5 border border-amber-200 flex gap-4">
                <div className="w-24 h-24 bg-amber-200 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
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
      <div className="bg-white rounded-2xl shadow-md border border-amber-200 p-5">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-4">
          
          {/* Search bar */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-amber-700/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, qualification, profession..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-amber-50/20"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
            {/* Gender Filter Buttons */}
            <div className="flex bg-amber-100/70 p-1 rounded-xl border border-amber-200">
              <button
                onClick={() => setGenderFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  genderFilter === 'all'
                    ? 'bg-red-900 text-white shadow'
                    : 'text-red-900 hover:bg-amber-200/60'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setGenderFilter('Male')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  genderFilter === 'Male'
                    ? 'bg-red-900 text-white shadow'
                    : 'text-red-900 hover:bg-amber-200/60'
                }`}
              >
                Grooms
              </button>
              <button
                onClick={() => setGenderFilter('Female')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  genderFilter === 'Female'
                    ? 'bg-red-900 text-white shadow'
                    : 'text-red-900 hover:bg-amber-200/60'
                }`}
              >
                Brides
              </button>
            </div>

            {/* Gotra Selector */}
            <input
              type="text"
              value={gotraFilter}
              onChange={(e) => setGotraFilter(e.target.value)}
              placeholder="Filter Gotra..."
              className="px-3 py-2 rounded-xl border border-amber-300 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />

            {/* City Selector */}
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filter City..."
              className="px-3 py-2 rounded-xl border border-amber-300 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>
        </div>

        {/* Counter & Action - CLICK TO REGISTER FAMILY DETAILS */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 pt-2 border-t border-amber-100 gap-2">
          <span>
            Showing <strong>{filteredProfiles.length}</strong> Rathore Samaj Biodatas
          </span>
          <button 
            type="button"
            className="text-red-800 hover:text-red-950 font-bold cursor-pointer underline flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/80 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
            onClick={() => setShowFamilyModal(true)}
          >
            <Users className="w-3.5 h-3.5 text-red-900" />
            + Click to register family details
          </button>
        </div>
      </div>

      {/* MATRIMONY CARDS GRID */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-amber-200 p-12 text-center text-slate-500">
          <p className="text-base font-semibold text-slate-700">No profiles found matching your search filters.</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing your filters or search keywords.</p>
          <button
            onClick={() => { setSearch(''); setGenderFilter('all'); setGotraFilter(''); setCityFilter(''); }}
            className="mt-4 bg-amber-500 hover:bg-amber-400 text-red-950 font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredProfiles.map((p) => {
            const photoUrl = p.photo && p.photo.trim() !== '' 
              ? p.photo 
              : p.gender === 'Female'
                ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";

            return (
              <div 
                key={p.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-amber-200/70 overflow-hidden flex flex-col sm:flex-row"
              >
                <div className="sm:w-2/5 relative h-64 sm:h-auto bg-amber-100">
                  <img 
                    src={photoUrl} 
                    alt={p.name} 
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = p.gender === 'Female'
                        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-red-900/90 text-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    Gotra: {p.gotra}
                  </div>
                </div>

                <div className="p-5 sm:w-3/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-1">
                          {p.name}
                        </h3>
                        <p className="text-xs text-amber-800 font-semibold mt-0.5">
                          {p.age} Yrs • {p.height || "5' 6\""}
                        </p>
                      </div>
                      <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md">
                        {p.city}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="line-clamp-1">{p.education}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="line-clamp-1">{p.profession}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenProfile(p.id)}
                      className="flex-1 bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-amber-100 text-xs font-bold py-2.5 px-3 rounded-xl shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Full Biodata
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-amber-300 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseModal} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {isProfileAccessible(activeProfile.id) ? (
              <div>
                {/* Status Bar */}
                <div className="flex items-center justify-between mb-3 bg-amber-100 p-2.5 rounded-xl text-xs font-bold text-amber-900">
                  <span>
                    🔓 Access Status: <strong>{hasRegisteredProfile ? 'Unlocked (Family Details Registered)' : `Free Contacts Left: ${remainingFreeContacts}`}</strong>
                  </span>
                  <span className="text-slate-600 hidden sm:inline">Contribute details to support Samaj</span>
                </div>

                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  <img 
                    src={activeProfile.photo && activeProfile.photo.trim() !== '' ? activeProfile.photo : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"} 
                    alt={activeProfile.name} 
                    className="w-28 h-28 rounded-2xl object-cover object-top border-2 border-amber-400 shadow-md shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                  <div className="w-full text-center sm:text-left">
                    <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                      <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        Gotra: {activeProfile.gotra}
                      </span>
                      <span className="bg-red-100 text-red-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {activeProfile.city}, {activeProfile.state || 'India'}
                      </span>
                      <span className="bg-blue-100 text-blue-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        ID: #{activeProfile.id}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold font-serif text-slate-900 mt-1">
                      {activeProfile.name}
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Age: {activeProfile.age} Yrs | Height: {activeProfile.height || 'N/A'} | Gender: {activeProfile.gender}
                    </p>
                    <p className="text-xs text-emerald-700 font-bold mt-1">
                      Income: {activeProfile.income || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Details box */}
                <div className="mt-4 space-y-3 border-t border-amber-100 pt-4 text-xs max-h-[50vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                    <div>
                      <span className="text-slate-500 font-medium">Education:</span>
                      <p className="font-bold text-slate-800">{activeProfile.education}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Profession:</span>
                      <p className="font-bold text-slate-800">{activeProfile.profession}</p>
                    </div>
                  </div>

                  {activeProfile.familyDetails && (
                    <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-1">
                      <span className="text-slate-500 font-bold uppercase text-[10px] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        Full Family Details (पारिवारिक विवरण):
                      </span>
                      <p className="font-semibold text-slate-800 leading-relaxed">{activeProfile.familyDetails}</p>
                    </div>
                  )}

                  {activeProfile.about && (
                    <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-1">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Additional Notes & Background (About):</span>
                      <p className="font-semibold text-slate-800">{activeProfile.about}</p>
                    </div>
                  )}

                  {/* Contact details */}
                  <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Contact Numbers:</span>
                      <p className="text-emerald-950 font-extrabold text-sm">{activeProfile.contact}</p>
                    </div>
                    <a 
                      href={`tel:${activeProfile.contact.split(',')[0].trim()}`} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs shrink-0 flex items-center gap-1.5 shadow"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Family
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* Free limit reached dialog */
              <div className="text-center space-y-4 py-4">
                <div className="w-20 h-20 bg-amber-100 rounded-full mx-auto flex items-center justify-center text-3xl shadow-inner border border-amber-300">
                  <ShieldAlert className="w-10 h-10 text-amber-800" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-red-950">Free View Limit Reached!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  You have viewed 3 free biodatas. To view unlimited community profiles, please register your family details to the Rathore Rishtey directory.
                </p>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-left space-y-1.5 max-w-sm mx-auto text-xs">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Community Mutual Sharing Policy
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    ✅ Help strengthen the Rathore Samaj directory network by registering your family details.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    handleCloseModal();
                    setShowFamilyModal(true);
                  }} 
                  className="w-full max-w-sm mx-auto bg-red-900 hover:bg-red-800 text-white font-bold py-3 rounded-xl shadow-lg block text-xs cursor-pointer transition-all"
                >
                  📝 Register Family Details Now (Unlock Unlimited Access)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED REGISTER FAMILY DETAILS FORM MODAL */}
      {showFamilyModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowFamilyModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-amber-300 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowFamilyModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3 border-b border-amber-100 pb-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-red-900 flex items-center justify-center font-bold text-lg border border-amber-300 shrink-0">
                👨‍👩‍👧‍👦
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-red-950 flex items-center gap-2">
                  Register Family Details (पारिवारिक विवरण)
                </h2>
                <p className="text-xs text-slate-500">
                  Enter your family background to publish in the Rathore Samaj directory & unlock unlimited access.
                </p>
              </div>
            </div>

            <form onSubmit={handleFamilySubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              
              {/* SECTION 1: CANDIDATE / MEMBER BASIC INFO */}
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
                <span className="font-bold text-red-950 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                  1. Candidate / Family Member Info (वर / वधु या सदस्य)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-bold block text-slate-700 mb-1">Candidate / Member Name *</label>
                    <input 
                      required 
                      type="text" 
                      value={familyForm.candidateName}
                      onChange={(e) => setFamilyForm({ ...familyForm, candidateName: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500" 
                      placeholder="e.g. Rohit Rathore" 
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Gender *</label>
                    <select 
                      value={familyForm.gender}
                      onChange={(e) => setFamilyForm({ ...familyForm, gender: e.target.value as 'Male' | 'Female' })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white"
                    >
                      <option value="Male">Male (Groom / वर)</option>
                      <option value="Female">Female (Bride / वधु)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PARENTS & ELDERS (MANDATORY FAMILY DETAILS) */}
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
                <span className="font-bold text-red-950 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-amber-700" />
                  2. Parents & Grandfather (माता-पिता एवं दादाजी विवरण)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Father's Name (पिताजी का नाम) *</label>
                    <input 
                      required 
                      type="text" 
                      value={familyForm.fatherName}
                      onChange={(e) => setFamilyForm({ ...familyForm, fatherName: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500" 
                      placeholder="e.g. Shri Ramchandra Rathore" 
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Father's Occupation (पिताजी का व्यवसाय) *</label>
                    <input 
                      required 
                      type="text" 
                      value={familyForm.fatherOccupation}
                      onChange={(e) => setFamilyForm({ ...familyForm, fatherOccupation: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white" 
                      placeholder="e.g. Business / Retired Gov Service / Farming" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Mother's Name (माताजी का नाम) *</label>
                    <input 
                      required 
                      type="text" 
                      value={familyForm.motherName}
                      onChange={(e) => setFamilyForm({ ...familyForm, motherName: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white" 
                      placeholder="e.g. Smt. Lata Rathore" 
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Mother's Status (माताजी का कार्य)</label>
                    <input 
                      type="text" 
                      value={familyForm.motherOccupation}
                      onChange={(e) => setFamilyForm({ ...familyForm, motherOccupation: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white" 
                      placeholder="e.g. Homemaker (गृहणी) / Teacher" 
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block text-slate-700 mb-1">Grandfather's Name (दादाजी का नाम)</label>
                  <input 
                    type="text" 
                    value={familyForm.grandfatherName}
                    onChange={(e) => setFamilyForm({ ...familyForm, grandfatherName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl border-amber-300 bg-white" 
                    placeholder="e.g. Late Shri Gangadharji Rathore" 
                  />
                </div>
              </div>

              {/* SECTION 3: GOTRA & SAMAJ CLAN DETAILS */}
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
                <span className="font-bold text-red-950 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  3. Gotra & Clan Details (स्वगोत्र एवं ननिहाल गोत्र)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Self Gotra (स्वगोत्र / राठौड़ गोत्र) *</label>
                    <input 
                      required 
                      type="text" 
                      value={familyForm.selfGotra}
                      onChange={(e) => setFamilyForm({ ...familyForm, selfGotra: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500" 
                      placeholder="e.g. Kadamaiye / Solanki / Roja / Thanpagar" 
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Maternal Gotra (मातृक / ननिहाल गोत्र) *</label>
                    <input 
                      required 
                      type="text" 
                      value={familyForm.maternalGotra}
                      onChange={(e) => setFamilyForm({ ...familyForm, maternalGotra: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500" 
                      placeholder="e.g. Magroriya / Chauhan / Katasare" 
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block text-slate-700 mb-1">Kuldevi / Kuldevta (कुलदेवी)</label>
                  <input 
                    type="text" 
                    value={familyForm.kuldevi}
                    onChange={(e) => setFamilyForm({ ...familyForm, kuldevi: e.target.value })}
                    className="w-full p-2.5 border rounded-xl border-amber-300 bg-white" 
                    placeholder="e.g. Maa Chamunda / Maa Nagnechiya" 
                  />
                </div>
              </div>

              {/* SECTION 4: SIBLINGS DETAILS */}
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
                <span className="font-bold text-red-950 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-700" />
                  4. Siblings Details (भाई एवं बहन विवरण)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Brothers (भाई विवरण)</label>
                    <input 
                      type="text" 
                      value={familyForm.brothers}
                      onChange={(e) => setFamilyForm({ ...familyForm, brothers: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white" 
                      placeholder="e.g. 1 elder brother (married, Software Eng.)" 
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Sisters (बहन विवरण)</label>
                    <input 
                      type="text" 
                      value={familyForm.sisters}
                      onChange={(e) => setFamilyForm({ ...familyForm, sisters: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white" 
                      placeholder="e.g. 1 younger sister (unmarried)" 
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: NATIVE PLACE, CITY & CONTACT */}
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
                <span className="font-bold text-red-950 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  5. Hometown & Contact (मूल निवास एवं संपर्क सूत्र)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Native Place / Hometown (मूल निवास) *</label>
                    <input 
                      required 
                      type="text" 
                      value={familyForm.nativePlace}
                      onChange={(e) => setFamilyForm({ ...familyForm, nativePlace: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500" 
                      placeholder="e.g. Khargone / Akot / Ratlam" 
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Current City / Address (वर्तमान शहर) *</label>
                    <input 
                      required 
                      type="text" 
                      value={familyForm.currentCity}
                      onChange={(e) => setFamilyForm({ ...familyForm, currentCity: e.target.value })}
                      className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500" 
                      placeholder="e.g. Indore, Madhya Pradesh" 
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block text-slate-700 mb-1">Family Contact Number & WhatsApp (संपर्क नंबर) *</label>
                  <input 
                    required 
                    type="tel" 
                    value={familyForm.familyContact}
                    onChange={(e) => setFamilyForm({ ...familyForm, familyContact: e.target.value })}
                    className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500" 
                    placeholder="e.g. +91 98260 00000, +91 94250 00000" 
                  />
                </div>

                <div>
                  <label className="font-bold block text-slate-700 mb-1">Family Status & Background (पारिवारिक परिचय व पृष्ठभूमि)</label>
                  <textarea 
                    rows={2}
                    value={familyForm.familyBackground}
                    onChange={(e) => setFamilyForm({ ...familyForm, familyBackground: e.target.value })}
                    className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500" 
                    placeholder="Write about joint/nuclear family, family business, ancestral values, etc..." 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-red-900 hover:bg-red-800 text-amber-100 font-bold py-3 rounded-xl shadow-lg mt-2 transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-amber-300" />
                Publish Family Details & Unlock All Profiles
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

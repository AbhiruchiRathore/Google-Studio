import React, { useState, useMemo } from 'react';
import { Search, GraduationCap, Briefcase, Eye, Phone, X, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';
import { MatrimonyProfile, GenderType, TabType } from '../types';

interface MatrimonyTabProps {
  profiles: MatrimonyProfile[];
  unlockedProfiles: (number | string)[];
  hasRegisteredProfile: boolean;
  onUnlockProfile: (id: number | string) => void;
  onNavigateTab: (tab: TabType) => void;
  onAddQuickProfile: (profile: Partial<MatrimonyProfile>) => void;
}

const FREE_LIMIT = 3;

export const MatrimonyTab: React.FC<MatrimonyTabProps> = ({
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
  
  // Quick Register Modal state
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickForm, setQuickForm] = useState({
    name: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female',
    gotra: '',
    city: '',
    contact: ''
  });

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.profession.toLowerCase().includes(q) || 
        p.education.toLowerCase().includes(q) ||
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

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.name || !quickForm.contact) return;
    
    onAddQuickProfile({
      name: quickForm.name,
      age: Number(quickForm.age) || 25,
      gender: quickForm.gender,
      gotra: quickForm.gotra || 'Rathore',
      city: quickForm.city || 'Indore',
      contact: quickForm.contact,
      education: 'Graduate',
      profession: 'Professional / Business',
      verified: true
    });

    setShowQuickModal(false);
    setQuickForm({ name: '', age: '', gender: 'Male', gotra: '', city: '', contact: '' });
  };

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

        {/* Counter & Action */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-amber-100">
          <span>
            Showing <strong>{filteredProfiles.length}</strong> Rathore Samaj Biodatas
          </span>
          <button 
            type="button"
            className="text-red-800 font-semibold cursor-pointer hover:underline flex items-center gap-1"
            onClick={() => setShowQuickModal(true)}
          >
            + Click to register your family's profile
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
                      className="flex-1 bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-amber-100 text-xs font-bold py-2.5 px-3 rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
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

      {/* MODAL CONTAINER */}
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {isProfileAccessible(activeProfile.id) ? (
              <div>
                {/* Status Bar */}
                <div className="flex items-center justify-between mb-3 bg-amber-100 p-2.5 rounded-xl text-xs font-bold text-amber-900">
                  <span>
                    🔓 Access Status: <strong>{hasRegisteredProfile ? 'Unlocked (Profile Registered)' : `Free Contacts Left: ${remainingFreeContacts}`}</strong>
                  </span>
                  <span className="text-slate-600 hidden sm:inline">Contribute profile to support Samaj</span>
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
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Family Details:</span>
                      <p className="font-semibold text-slate-800">{activeProfile.familyDetails}</p>
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
                  You have viewed 3 free biodatas. To view unlimited community profiles, please publish your own family's profile to the Rathore Rishtey directory.
                </p>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-left space-y-1.5 max-w-sm mx-auto text-xs">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Community Mutual Sharing Policy
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    ✅ Help strengthen the Rathore Samaj directory network by sharing your matrimonial profile.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    handleCloseModal();
                    onNavigateTab('create-profile');
                  }} 
                  className="w-full max-w-sm mx-auto bg-red-900 hover:bg-red-800 text-white font-bold py-3 rounded-xl shadow-lg block text-xs cursor-pointer transition-all"
                >
                  📝 Register Your Profile Now (Free Unlimited Access)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK PROFILE SUBMISSION MODAL */}
      {showQuickModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowQuickModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-300 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowQuickModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-serif font-bold text-red-950 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-700" /> Register Biodata Form
            </h2>
            <p className="text-xs text-slate-500 mb-4">Quickly list a candidate profile in the community directory.</p>

            <form onSubmit={handleQuickSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Full Name *</label>
                <input 
                  required 
                  type="text" 
                  value={quickForm.name}
                  onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500 bg-amber-50/20" 
                  placeholder="e.g. Rahul Rathore" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Age *</label>
                  <input 
                    required 
                    type="number" 
                    value={quickForm.age}
                    onChange={(e) => setQuickForm({ ...quickForm, age: e.target.value })}
                    className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                    placeholder="26"
                  />
                </div>
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Gender *</label>
                  <select 
                    value={quickForm.gender}
                    onChange={(e) => setQuickForm({ ...quickForm, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full p-2.5 border rounded-xl border-amber-300 bg-white"
                  >
                    <option value="Male">Male (Groom)</option>
                    <option value="Female">Female (Bride)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block text-slate-700 mb-1">Gotra & City *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    required 
                    type="text" 
                    value={quickForm.gotra}
                    onChange={(e) => setQuickForm({ ...quickForm, gotra: e.target.value })}
                    className="w-full p-2.5 border rounded-xl border-amber-300" 
                    placeholder="Gotra" 
                  />
                  <input 
                    required 
                    type="text" 
                    value={quickForm.city}
                    onChange={(e) => setQuickForm({ ...quickForm, city: e.target.value })}
                    className="w-full p-2.5 border rounded-xl border-amber-300" 
                    placeholder="City" 
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block text-slate-700 mb-1">Contact Number *</label>
                <input 
                  required 
                  type="tel" 
                  value={quickForm.contact}
                  onChange={(e) => setQuickForm({ ...quickForm, contact: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300" 
                  placeholder="10-digit mobile number" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-red-900 hover:bg-red-800 text-amber-100 font-bold py-3 rounded-xl shadow-lg mt-2 transition-all cursor-pointer"
              >
                Submit Profile & Unlock Access
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Lock, UserCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { MatrimonyProfile, TabType, AuthSession } from '../types';

interface CreateProfileTabProps {
  authSession: AuthSession | null;
  onLogin: (session: AuthSession) => void;
  onAddProfile: (profile: MatrimonyProfile) => void;
  onNavigateTab: (tab: TabType) => void;
}

export const CreateProfileTab: React.FC<CreateProfileTabProps> = ({
  authSession,
  onLogin,
  onAddProfile,
  onNavigateTab
}) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male' as 'Male' | 'Female',
    dob: '',
    birthTime: '',
    gotra: '',
    phone: '',
    education: '',
    occupation: '',
    income: '',
    native: '',
    location: '',
    bio: '',
    height: "5' 7\"",
    photoUrl: ''
  });

  const [phoneInput, setPhoneInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 25;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : 25;
  };

  const handleQuickLogin = (method: 'Google' | 'Phone') => {
    const session: AuthSession = {
      method,
      name: method === 'Google' ? 'Google User' : undefined,
      phone: method === 'Phone' ? (phoneInput || '9826000000') : undefined,
      loggedInAt: new Date().toISOString()
    };
    onLogin(session);
    alert(`✅ Signed in successfully! You can now complete your matrimonial profile, and access the "Create Profile" and "Advertise Business" tabs.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.gotra || !formData.education) {
      alert("Please fill in all required fields.");
      return;
    }

    const calculatedAge = formData.dob ? calculateAge(formData.dob) : 26;

    const newProfile: MatrimonyProfile = {
      id: Date.now(),
      name: formData.name,
      gender: formData.gender,
      dob: formData.dob,
      birthTime: formData.birthTime,
      age: calculatedAge,
      height: formData.height || "5' 7\"",
      gotra: formData.gotra,
      phone: formData.phone,
      contact: formData.phone,
      education: formData.education,
      profession: formData.occupation,
      income: formData.income || 'Not Specified',
      native: formData.native,
      city: formData.location || formData.native || 'Indore',
      state: 'Madhya Pradesh',
      location: formData.location || formData.native,
      about: formData.bio,
      familyDetails: `Native: ${formData.native || 'Central India'}. Registered by family on Rathore Rishtey digital portal.`,
      photo: formData.photoUrl.trim() !== '' 
        ? formData.photoUrl 
        : formData.gender === 'Female' 
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' 
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      verified: true,
      createdAt: new Date().toISOString()
    };

    onAddProfile(newProfile);
    alert("🎉 Success! Your profile has been successfully published to the Rathore Rishtey directory.");
    onNavigateTab('matrimony');
  };

  // If user is not signed in yet, show auth gate
  if (!authSession) {
    return (
      <div className="space-y-6 max-w-md mx-auto py-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-amber-200 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center text-3xl border border-amber-300">
            <Lock className="w-8 h-8 text-amber-800" />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-red-950">Sign In to Create Profile</h2>
            <p className="text-xs text-slate-600 mt-1">
              Please sign in first. Once signed in, you can create your profile, post business ads, and access these tabs directly from the top navigation.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button 
              type="button"
              onClick={() => handleQuickLogin('Google')} 
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl shadow-xs transition-all text-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              Continue with Google
            </button>

            <button 
              type="button"
              onClick={() => onNavigateTab('signup')} 
              className="w-full bg-red-900 hover:bg-red-800 text-amber-100 font-bold py-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
            >
              Sign In with Mobile OTP
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Publishing your profile also unlocks <strong>unlimited biodata views</strong> across the entire Rathore Samaj directory.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-4">
      <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-amber-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Signed In
              </span>
              <span className="text-xs text-slate-500">
                {authSession.name || `+91 ${authSession.phone}`}
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-red-950 mt-1">📝 Create Matrimonial Profile</h2>
            <p className="text-xs text-slate-500">
              Fill out your details to list your profile on Rathore Rishtey & unlock unlimited directory access.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => onNavigateTab('matrimony')} 
            className="text-xs text-slate-500 hover:text-red-900 font-bold p-1 cursor-pointer"
          >
            Cancel ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
                placeholder="e.g., Rohit Rathore" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
              <select 
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="Male">Male (Boy)</option>
                <option value="Female">Female (Girl)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
              <input 
                type="date" 
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Birth Time</label>
              <input 
                type="time" 
                name="birthTime"
                value={formData.birthTime}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Height</label>
              <input 
                type="text" 
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="e.g. 5' 8&quot;" 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gotra *</label>
              <input 
                type="text" 
                name="gotra"
                value={formData.gotra}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder="e.g., Rathore / Solanki / Kadamaiyye" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number *</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder="10-digit mobile number" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Education *</label>
              <input 
                type="text" 
                name="education"
                value={formData.education}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder="e.g., B.Tech, MBA, Graduate" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Occupation *</label>
              <input 
                type="text" 
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder="e.g., Software Engineer, Business" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Annual Income</label>
              <input 
                type="text" 
                name="income"
                value={formData.income}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder="e.g., 6 LPA" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Native Place / Hometown *</label>
              <input 
                type="text" 
                name="native"
                value={formData.native}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder="e.g., Khargone, Indore" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current City / Location</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder="e.g., Pune" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Photo Image URL (Optional)</label>
            <input 
              type="url" 
              name="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
              className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
              placeholder="https://... (or leave blank for standard Samaj avatar)" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">About / Expectations / Bio *</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3} 
              required 
              className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
              placeholder="Write briefly about education, family background, and expectations..." 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-3 rounded-xl text-xs shadow-lg transition-all cursor-pointer"
          >
            Publish Profile to App Directory
          </button>
        </form>
      </div>
    </div>
  );
};

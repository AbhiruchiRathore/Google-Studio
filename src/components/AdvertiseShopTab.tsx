import React, { useState } from 'react';
import { Store, Lock, ShieldCheck } from 'lucide-react';
import { BusinessAd, TabType, AuthSession } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';

interface AdvertiseShopTabProps {
  authSession: AuthSession | null;
  onLogin: (session: AuthSession) => void;
  onAddAd: (ad: BusinessAd) => void;
  onNavigateTab: (tab: TabType) => void;
}

export const AdvertiseShopTab: React.FC<AdvertiseShopTabProps> = ({
  authSession,
  onLogin,
  onAddAd,
  onNavigateTab
}) => {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    owner: authSession?.name || '',
    category: '',
    phone: authSession?.phone || '',
    address: '',
    city: 'Indore',
    description: '',
    offer: 'Special Discount for Rathore Samaj Members',
    isFeatured: false,
    bannerUrl: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    const name = target.name;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleSuccess = (session: AuthSession) => {
    setShowGoogleModal(false);
    onLogin(session);
    setFormData(prev => ({ ...prev, owner: session.name || prev.owner }));
    alert(`✅ Connected with Google as ${session.name}! You can now submit your business listing.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.owner || !formData.category || !formData.phone || !formData.address) {
      alert("Please fill in all required fields.");
      return;
    }

    const newAd: BusinessAd = {
      id: Date.now(),
      title: formData.name,
      owner: formData.owner,
      category: formData.category,
      city: formData.city || 'Indore',
      address: formData.address,
      phone: formData.phone,
      tagline: formData.description,
      description: formData.description,
      offer: formData.offer,
      rating: '5.0 ★',
      isFeatured: formData.isFeatured,
      banner: formData.bannerUrl.trim() !== '' 
        ? formData.bannerUrl 
        : formData.isFeatured 
          ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=600&q=80',
      createdAt: new Date().toISOString()
    };

    onAddAd(newAd);
    alert("🎉 Success! Your business advertisement has been published.");
    onNavigateTab('directory');
  };

  // If user is not signed in yet, show auth gate
  if (!authSession) {
    return (
      <div className="space-y-6 max-w-md mx-auto py-8">
        <GoogleSignInModal 
          isOpen={showGoogleModal}
          onClose={() => setShowGoogleModal(false)}
          onSuccess={handleGoogleSuccess}
        />

        <div className="bg-white p-6 md:p-8 rounded-2xl border border-amber-200 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center text-3xl border border-amber-300">
            <Lock className="w-8 h-8 text-amber-800" />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-red-950">Sign In to Advertise Business</h2>
            <p className="text-xs text-slate-600 mt-1">
              Please sign in to promote your business across the Rathore Samaj network. Once signed in, you will see the Advertise Shop and Create Profile tabs in the top navigation.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button 
              type="button"
              onClick={() => setShowGoogleModal(true)} 
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl shadow-xs transition-all text-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              Continue with Google (Permissions Required)
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
            Reach thousands of community families in Indore, Khargone, Ujjain, Ratlam and more.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-4">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-5">
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Signed In
              </span>
              <span className="text-xs text-stone-500">
                {authSession.name || `+91 ${authSession.phone}`}
              </span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1">Advertise Your Business</h2>
            <p className="text-xs text-stone-500 font-light">Promote your shop & exclusive Samaj member offers across our community network.</p>
          </div>
          <button 
            type="button"
            onClick={() => onNavigateTab('directory')} 
            className="text-xs text-stone-400 hover:text-stone-700 font-semibold p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors"
          >
            Cancel ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Business / Shop Name *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
                placeholder="e.g., Rathore Shree Dresses" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name *</label>
              <input 
                type="text" 
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
                placeholder="e.g., Ramchandra Rathore" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Business Category *</label>
              <input 
                type="text" 
                name="category"
                value={formData.category}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
                placeholder="e.g., Clothing & Retail, Jewelry, Hardware" 
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
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
                placeholder="10-digit mobile number" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shop Address / Location *</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
                placeholder="e.g., Radha Vallabh Market, Khargone" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input 
                type="text" 
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
                placeholder="e.g., Indore / Khargone / Ujjain" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Special Discount / Offer for Samaj</label>
            <input 
              type="text" 
              name="offer"
              value={formData.offer}
              onChange={handleChange}
              className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
              placeholder="e.g., 10% Discount on all purchases for Rathore Samaj members" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Shop Banner Image URL (Optional)</label>
            <input 
              type="url" 
              name="bannerUrl"
              value={formData.bannerUrl}
              onChange={handleChange}
              className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
              placeholder="https://... (or leave empty for default category banner)" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Business Description & Highlights *</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3} 
              required 
              className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
              placeholder="Write about your products, services, or wholesale deals..." 
            />
          </div>

          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 flex items-center gap-3">
            <input 
              type="checkbox" 
              id="isFeatured"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="w-4 h-4 rounded text-red-950 border-amber-400 focus:ring-amber-500" 
            />
            <label htmlFor="isFeatured" className="text-xs font-bold text-red-950 cursor-pointer">
              ⭐ Highlight as Featured Top Banner Shop (Special Placement)
            </label>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer border border-amber-400/30 hover:scale-[1.01]"
          >
            Publish Business Ad to Directory
          </button>
        </form>
      </div>
    </div>
  );
};

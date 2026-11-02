import React, { useState } from 'react';
import { Store, PlusCircle, Phone, Tag, Star, X, Sparkles, UserPlus } from 'lucide-react';
import { BusinessAd, TabType, AuthSession } from '../types';

interface BusinessTabProps {
  authSession: AuthSession | null;
  ads: BusinessAd[];
  onNavigateTab: (tab: TabType) => void;
  onAddQuickAd: (ad: Partial<BusinessAd>) => void;
}

export const BusinessTab: React.FC<BusinessTabProps> = ({
  authSession,
  ads,
  onNavigateTab,
  onAddQuickAd
}) => {
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formState, setFormState] = useState({
    title: '',
    owner: '',
    category: 'Clothing & Retail',
    phone: '',
    address: '',
    tagline: '',
    offer: 'Special Samaj Member Discount',
    tier: 'free' as 'free' | 'featured'
  });

  const categories = ['all', 'Clothing & Retail', 'Hardware & Home Imprv.', 'Jewelry & Gold'];

  const filteredAds = ads.filter(ad => {
    if (selectedCategory === 'all') return true;
    return ad.category === selectedCategory;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.phone) return;

    onAddQuickAd({
      title: formState.title,
      owner: formState.owner || 'Samaj Business Owner',
      category: formState.category,
      city: 'Indore',
      address: formState.address || 'Main City Market',
      phone: formState.phone,
      tagline: formState.tagline || 'Quality services & verified products for community members.',
      offer: formState.offer,
      rating: '5.0 ★',
      isFeatured: formState.tier === 'featured',
      banner: formState.tier === 'featured'
        ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=600&q=80'
    });

    setShowQuickModal(false);
    setFormState({
      title: '',
      owner: '',
      category: 'Clothing & Retail',
      phone: '',
      address: '',
      tagline: '',
      offer: 'Special Samaj Member Discount',
      tier: 'free'
    });

    if (formState.tier === 'featured') {
      alert("🎉 Business Ad submitted! The ₹500 Featured Top Banner badge is enabled.");
    } else {
      alert("🎉 Standard Business Ad published successfully to Rathore Rishtey!");
    }
  };

  return (
    <div className="space-y-6">
      {/* HERO BANNER SECTION */}
      <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-amber-500/30">
        <div className="space-y-2 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rathore Samaj Business Network</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-50">
            Promote Your Business & Shop
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl font-light leading-relaxed">
            Reach thousands of Rathore Samaj families across MP, Rajasthan, and Maharashtra. Replace outdated printed booklets with live interactive digital storefronts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          {authSession ? (
            <button 
              onClick={() => onNavigateTab('advertise-shop')}
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-5 py-3 rounded-xl shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
            >
              <PlusCircle className="w-4 h-4 text-stone-950" />
              <span>Post Shop Advertisement</span>
            </button>
          ) : (
            <button 
              onClick={() => onNavigateTab('signup')}
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-5 py-3 rounded-xl shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
            >
              <UserPlus className="w-4 h-4 text-stone-950" />
              <span>Sign In to Post Shop Ad</span>
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY FILTER BAR */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-xs">
        <span className="text-xs font-bold text-stone-700 ml-2 mr-1">Categories:</span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#380812] text-amber-200 shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {cat === 'all' ? 'All Businesses' : cat}
          </button>
        ))}
      </div>

      {/* ADS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.map((ad) => {
          const bannerUrl = ad.banner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80";

          return (
            <div 
              key={ad.id} 
              className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-amber-400/50 transition-all duration-300 group"
            >
              <div>
                <div className="relative h-44 bg-stone-100 overflow-hidden">
                  <img 
                    src={bannerUrl} 
                    alt={ad.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 bg-[#24050b]/90 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-md shadow-xs border border-amber-500/30 backdrop-blur-xs">
                    {ad.category}
                  </div>
                  {ad.isFeatured && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 text-xs font-bold px-2.5 py-1 rounded-md shadow flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-stone-950" /> Featured
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg text-stone-900 font-serif mb-1 leading-snug group-hover:text-[#380812] transition-colors">
                    {ad.title}
                  </h3>

                  {/* ZERO-PILL METADATA LINE */}
                  <p className="text-xs text-stone-600 font-medium mb-2.5">
                    Owner: {ad.owner} {ad.city ? `· ${ad.city}` : ''}
                  </p>

                  <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                    {ad.tagline || ad.description}
                  </p>

                  {ad.address && (
                    <p className="text-[11px] text-stone-500 mb-3">
                      📍 {ad.address}
                    </p>
                  )}

                  {ad.offer && (
                    <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs p-2.5 rounded-xl font-semibold mb-3 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{ad.offer}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 pt-0">
                <a 
                  href={`tel:${ad.phone}`} 
                  className="w-full bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs border border-amber-500/20 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-300" /> Call Owner ({ad.phone})
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK AD MODAL (AVAILABLE FOR SIGNED IN MEMBERS) */}
      {showQuickModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowQuickModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowQuickModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-serif font-bold text-red-950 mb-1 flex items-center gap-2">
              <Store className="w-6 h-6 text-amber-700" /> Advertise Your Business
            </h2>
            <p className="text-xs text-slate-500 mb-4">Promote your shop in the directory.</p>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Shop Name *</label>
                <input 
                  required 
                  type="text" 
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                  placeholder="e.g. Rathore Shree Sarees" 
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Owner Name *</label>
                <input 
                  required 
                  type="text" 
                  value={formState.owner}
                  onChange={(e) => setFormState({ ...formState, owner: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                  placeholder="e.g. Rameshwar Rathore" 
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tagline & Offer *</label>
                <textarea 
                  required 
                  rows={2} 
                  value={formState.tagline}
                  onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                  placeholder="Special offer for Rathore Samaj members..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone *</label>
                <input 
                  required 
                  type="tel" 
                  value={formState.phone}
                  onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                  placeholder="10-digit mobile number" 
                />
              </div>

              {/* Business Subscription Tier */}
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 space-y-2">
                <label className="font-bold text-amber-900 block">Select Ad Listing Type:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="ad_tier" 
                    id="tier-free" 
                    checked={formState.tier === 'free'}
                    onChange={() => setFormState({ ...formState, tier: 'free' })}
                    value="free" 
                  />
                  <label htmlFor="tier-free" className="text-slate-800 cursor-pointer">
                    Standard Listing (Free)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="ad_tier" 
                    id="tier-featured" 
                    checked={formState.tier === 'featured'}
                    onChange={() => setFormState({ ...formState, tier: 'featured' })}
                    value="featured" 
                  />
                  <label htmlFor="tier-featured" className="font-bold text-red-900 flex items-center gap-1 cursor-pointer">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Featured Top Banner Ad (₹500 / Year)
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-400 text-red-950 font-bold py-3 rounded-xl shadow mt-2 cursor-pointer transition-colors"
              >
                Submit Advertisement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

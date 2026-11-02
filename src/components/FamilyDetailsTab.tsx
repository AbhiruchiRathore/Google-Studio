import React, { useState } from 'react';
import { 
  Users, Home, ShieldCheck, Phone, ArrowLeft, CheckCircle2, 
  Sparkles, Heart, MapPin, User, AlertCircle, ArrowRight
} from 'lucide-react';
import { TabType, AuthSession, MatrimonyProfile } from '../types';

interface FamilyDetailsTabProps {
  authSession: AuthSession | null;
  onNavigateTab: (tab: TabType) => void;
  onAddQuickProfile: (profile: Partial<MatrimonyProfile>) => void;
  hasRegisteredProfile: boolean;
}

export const FamilyDetailsTab: React.FC<FamilyDetailsTabProps> = ({
  authSession,
  onNavigateTab,
  onAddQuickProfile,
  hasRegisteredProfile
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
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
    kuldevi: '',
    brothers: '',
    sisters: '',
    nativePlace: '',
    currentCity: '',
    currentState: 'Madhya Pradesh',
    familyContact: authSession?.phone ? `+91 ${authSession.phone}` : '',
    secondaryContact: '',
    familyBackground: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.fatherName.trim() || !form.selfGotra.trim() || !form.nativePlace.trim() || !form.familyContact.trim()) {
      setErrorMsg("Please fill in all mandatory fields: Father's Name, Self Gotra, Native Place, and Family Contact Number.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const candidateDisplayName = form.candidateName.trim() || `Son/Daughter of ${form.fatherName.trim()}`;
    const familyDetailsSummary = `Father: ${form.fatherName} (${form.fatherOccupation || 'Service/Business'}), Mother: ${form.motherName || 'Smt. Rathore'} (${form.motherOccupation || 'Homemaker'}), Grandfather: ${form.grandfatherName || 'Respected Elder'}. Siblings: ${form.brothers || '0'} brother(s), ${form.sisters || '0'} sister(s). Maternal Gotra: ${form.maternalGotra || 'Kshatriya Rathore'}. Native Place: ${form.nativePlace}.`;
    
    const contactString = form.secondaryContact.trim() 
      ? `${form.familyContact.trim()}, ${form.secondaryContact.trim()}`
      : form.familyContact.trim();

    const aboutFamily = `Maternal (Nanihaal) Gotra: ${form.maternalGotra || 'Not specified'}. Kuldevi: ${form.kuldevi || 'Maa Chamunda / Kuldevi'}. ${form.familyBackground || 'Well-settled respected Rathore Samaj family.'}`;

    onAddQuickProfile({
      name: candidateDisplayName,
      age: Number(form.age) || 26,
      gender: form.gender,
      gotra: form.selfGotra.trim(),
      city: form.currentCity.trim() || form.nativePlace.trim() || 'Indore',
      state: form.currentState.trim() || 'Madhya Pradesh',
      native: form.nativePlace.trim(),
      location: `${form.currentCity || form.nativePlace}, ${form.currentState}`,
      contact: contactString,
      phone: form.familyContact.trim(),
      education: 'Graduate / Professional',
      profession: 'Service / Business / Professional',
      income: 'Competitive',
      familyDetails: familyDetailsSummary,
      about: aboutFamily,
      verified: true
    });

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-300 p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Registration Successful
            </span>
            <h2 className="text-3xl font-serif font-bold text-slate-900">
              Family Details Added Successfully!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your family's details have been registered into the <strong>Rathore Rishtey Digital Directory</strong>.
            </p>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-red-950">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Unlimited Contact Unlocks Activated</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              In accordance with our community mutual-sharing policy, your profile is now active and you have unlocked full access to all candidate contacts and biodata details across the directory.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => onNavigateTab('matrimony')}
              className="bg-red-900 hover:bg-red-800 text-amber-100 font-bold px-6 py-3 rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Users className="w-4 h-4 text-amber-300" />
              Browse All Matrimony Biodatas
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({
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
                  kuldevi: '',
                  brothers: '',
                  sisters: '',
                  nativePlace: '',
                  currentCity: '',
                  currentState: 'Madhya Pradesh',
                  familyContact: '',
                  secondaryContact: '',
                  familyBackground: ''
                });
              }}
              className="bg-amber-100 hover:bg-amber-200 text-red-950 font-bold px-6 py-3 rounded-xl text-xs transition-colors"
            >
              Add Another Family Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('matrimony')}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
              Add Family Details
              <span className="text-xs font-sans font-medium text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                पारिवारिक विवरण
              </span>
            </h1>
            <p className="text-xs text-stone-500">
              Register your family lineage & biodata into the Rathore Samaj Matrimony Directory
            </p>
          </div>
        </div>

        {hasRegisteredProfile && (
          <span className="bg-emerald-50 text-emerald-800 font-semibold text-xs px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Family Profile Already Registered
          </span>
        )}
      </div>

      {/* Community Directory Mutual Sharing Policy Notice */}
      <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-amber-500/30 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold flex items-center justify-center text-2xl shadow-md shrink-0">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-serif font-bold text-amber-200 flex items-center justify-center sm:justify-start gap-2">
            Why Register Family Details? (पारिवारिक पंजीकरण का महत्व)
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed font-light">
            Our Samaj thrives on mutual trust and verified connections. By contributing your family details, your biodata is securely visible to verified community families, and you instantly unlock unlimited views to 450+ candidate contacts across India.
          </p>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-stone-200/90 p-6 sm:p-8 space-y-6">
        
        {/* SECTION 1: CANDIDATE INFO */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
            <User className="w-4 h-4 text-red-900" />
            <h3 className="font-bold text-red-950 text-sm uppercase tracking-wider">
              1. Candidate Details (प्रत्याशी विवरण)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-bold block text-slate-700 mb-1.5">
                Candidate Full Name (प्रत्याशी का पूरा नाम)
              </label>
              <input 
                type="text" 
                value={form.candidateName}
                onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Rahul Rathore / Priya Rathore (Optional if only sharing family)" 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Gender (लिंग) *
              </label>
              <select 
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'Male' | 'Female' })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Male">Groom / वर (Male)</option>
                <option value="Female">Bride / वधु (Female)</option>
              </select>
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Age in Years (उम्र)
              </label>
              <input 
                type="number" 
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="26"
                min="18"
                max="65"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PARENTS & ELDERS */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
            <Home className="w-4 h-4 text-red-900" />
            <h3 className="font-bold text-red-950 text-sm uppercase tracking-wider">
              2. Parents & Grandfather (माता-पिता एवं दादाजी विवरण)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Father's Name (पिताजी का नाम) <span className="text-red-600">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Shri Mohanlal Rathore" 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Father's Occupation (पिताजी का व्यवसाय)
              </label>
              <input 
                type="text" 
                value={form.fatherOccupation}
                onChange={(e) => setForm({ ...form, fatherOccupation: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Business (Grocery / Cloth) / Govt. Service / Retired" 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Mother's Name (माताजी का नाम)
              </label>
              <input 
                type="text" 
                value={form.motherName}
                onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Smt. Kamala Rathore" 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Mother's Status / Occupation (माताजी का कार्य)
              </label>
              <input 
                type="text" 
                value={form.motherOccupation}
                onChange={(e) => setForm({ ...form, motherOccupation: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Homemaker (गृहणी) / Teacher" 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold block text-slate-700 mb-1.5">
                Grandfather's Name (दादाजी का नाम)
              </label>
              <input 
                type="text" 
                value={form.grandfatherName}
                onChange={(e) => setForm({ ...form, grandfatherName: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Late Shri Govindramji Rathore" 
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: GOTRA & SAMAJ CLAN DETAILS */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
            <ShieldCheck className="w-4 h-4 text-red-900" />
            <h3 className="font-bold text-red-950 text-sm uppercase tracking-wider">
              3. Gotra & Clan Details (स्वगोत्र, ननिहाल गोत्र एवं कुलदेवी)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Self Gotra (स्वगोत्र / राठौड़ गोत्र) <span className="text-red-600">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={form.selfGotra}
                onChange={(e) => setForm({ ...form, selfGotra: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Kadamaiye / Solanki / Roja / Thanpagar" 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Maternal Gotra (मातृक / ननिहाल गोत्र)
              </label>
              <input 
                type="text" 
                value={form.maternalGotra}
                onChange={(e) => setForm({ ...form, maternalGotra: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Magroriya / Katasare / Chauhan" 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Kuldevi / Kuldevta (कुलदेवी)
              </label>
              <input 
                type="text" 
                value={form.kuldevi}
                onChange={(e) => setForm({ ...form, kuldevi: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Maa Chamunda / Maa Nagnechiya" 
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: SIBLINGS DETAILS */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
            <Users className="w-4 h-4 text-red-900" />
            <h3 className="font-bold text-red-950 text-sm uppercase tracking-wider">
              4. Siblings Details (भाई एवं बहन विवरण)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Brothers (भाई विवरण)
              </label>
              <input 
                type="text" 
                value={form.brothers}
                onChange={(e) => setForm({ ...form, brothers: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. 1 elder brother (married, Software Engineer)" 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Sisters (बहन विवरण)
              </label>
              <input 
                type="text" 
                value={form.sisters}
                onChange={(e) => setForm({ ...form, sisters: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. 1 younger sister (unmarried, studying B.Com)" 
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: HOMETOWN, RESIDENCE & CONTACT */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
            <Phone className="w-4 h-4 text-red-900" />
            <h3 className="font-bold text-red-950 text-sm uppercase tracking-wider">
              5. Hometown & Contact Information (मूल निवास एवं संपर्क सूत्र)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Native Place / Hometown (मूल निवास) <span className="text-red-600">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={form.nativePlace}
                onChange={(e) => setForm({ ...form, nativePlace: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Khargone / Akot / Ratlam / Badwani" 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Current City of Residence (वर्तमान शहर)
              </label>
              <input 
                type="text" 
                value={form.currentCity}
                onChange={(e) => setForm({ ...form, currentCity: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Indore / Bhopal / Pune" 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                State (राज्य)
              </label>
              <input 
                type="text" 
                value={form.currentState}
                onChange={(e) => setForm({ ...form, currentState: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="Madhya Pradesh" 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold block text-slate-700 mb-1.5">
                Primary Family Phone & WhatsApp Number <span className="text-red-600">*</span>
              </label>
              <input 
                required 
                type="tel" 
                value={form.familyContact}
                onChange={(e) => setForm({ ...form, familyContact: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. +91 98260 12345" 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                Secondary Phone Number (वैकल्पिक संपर्क)
              </label>
              <input 
                type="tel" 
                value={form.secondaryContact}
                onChange={(e) => setForm({ ...form, secondaryContact: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. +91 94250 67890" 
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-bold block text-slate-700 mb-1.5">
                Family Status & Background Notes (पारिवारिक परिचय व प्रतिष्ठा)
              </label>
              <textarea 
                rows={3}
                value={form.familyBackground}
                onChange={(e) => setForm({ ...form, familyBackground: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder="e.g. Respectable Kshatriya Rathore family, ancestral land in native place, living as nuclear/joint family with modern yet traditional values..." 
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button 
            type="submit" 
            className="flex-1 bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer border border-amber-400/30 hover:scale-[1.01]"
          >
            <Users className="w-4 h-4 text-amber-300" />
            Publish Family Details & Unlock All 450+ Biodatas
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('matrimony')}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3.5 px-6 rounded-2xl text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

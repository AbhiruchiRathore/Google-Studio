import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Users, AlertCircle, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { MatrimonyProfile, TabType, AuthSession } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';
import {
  getExistingDeviceGoogleSession,
  isAndroidEnvironment,
  signInWithAndroidWebView,
  signInWithDesktopBrowser
} from './SignUpTab';
import { sanitizePhoneInput, validatePhoneNumber } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';
import { MultiPhotoUploadField } from './MultiPhotoUploadField';

interface CreateProfileTabProps {
  authSession: AuthSession | null;
  onLogin: (session: AuthSession) => void;
  onAddProfile: (profile: MatrimonyProfile) => boolean | void;
  onNavigateTab: (tab: TabType) => void;
  hasRegisteredProfile?: boolean;
  existingUserProfile?: MatrimonyProfile | null;
}

export const CreateProfileTab: React.FC<CreateProfileTabProps> = ({
  authSession,
  onLogin,
  onAddProfile,
  onNavigateTab,
  hasRegisteredProfile = false,
  existingUserProfile = null
}) => {
  const { lang, t } = useLanguage();
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: authSession?.name || '',
    gender: 'Male' as 'Male' | 'Female',
    dob: '',
    birthTime: '',
    gotra: '',
    phone: sanitizePhoneInput(authSession?.phone || ''),
    education: '',
    occupation: '',
    income: '',
    native: '',
    location: '',
    bio: '',
    height: "5' 7\"",
    photos: authSession?.photoUrl ? [authSession.photoUrl] : ([] as string[]),
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    maternalGotra: '',
    grandfatherName: '',
    siblings: ''
  });

  useEffect(() => {
    if (authSession) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || authSession.name || '',
        phone: prev.phone || sanitizePhoneInput(authSession.phone || ''),
        photos: prev.photos.length > 0 ? prev.photos : (authSession.photoUrl ? [authSession.photoUrl] : [])
      }));
    }
  }, [authSession]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const cleaned = sanitizePhoneInput(value);
      setFormData(prev => ({ ...prev, phone: cleaned }));
      if (cleaned.length > 0) {
        const check = validatePhoneNumber(cleaned, true);
        setPhoneError(check.valid ? null : (lang === 'hi' ? check.errorHi || null : check.errorEn || null));
      } else {
        setPhoneError(null);
      }
      return;
    }
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

  const handleGoogleSuccess = (session: AuthSession) => {
    setShowGoogleModal(false);
    onLogin(session);
  };

  const handleDirectGoogleClick = async () => {
    const existing = getExistingDeviceGoogleSession();
    if (existing) {
      onLogin(existing);
      return;
    }
    try {
      if (isAndroidEnvironment()) {
        await signInWithAndroidWebView(onLogin);
      } else {
        await signInWithDesktopBrowser(onLogin);
      }
    } catch {
      setShowGoogleModal(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.gotra.trim() || !formData.education.trim()) {
      setFormError(t('Please fill in all required fields.', 'कृपया सभी आवश्यक विवरण भरें।'));
      return;
    }

    const phoneCheck = validatePhoneNumber(formData.phone, true);
    if (!phoneCheck.valid) {
      const msg = lang === 'hi' ? (phoneCheck.errorHi || '') : (phoneCheck.errorEn || '');
      setPhoneError(msg);
      setFormError(msg);
      return;
    }

    const calculatedAge = formData.dob ? calculateAge(formData.dob) : 26;

    const familyDetailsFormatted = formData.fatherName
      ? `Father: ${formData.fatherName} (${formData.fatherOccupation || 'Service/Business'}), Mother: ${formData.motherName || 'Homemaker'}, Grandfather: ${formData.grandfatherName || 'Respected Elder'}, Siblings: ${formData.siblings || 'Siblings'}. Maternal Gotra: ${formData.maternalGotra || 'Kshatriya'}. Native: ${formData.native}.`
      : `Native: ${formData.native || 'Central India'}. Registered by family on Rathore Rishtey digital portal.`;

    const newProfile: MatrimonyProfile = {
      id: Date.now(),
      name: formData.name.trim(),
      gender: formData.gender,
      dob: formData.dob,
      birthTime: formData.birthTime,
      age: calculatedAge,
      height: formData.height || "5' 7\"",
      gotra: formData.gotra.trim(),
      phone: phoneCheck.cleaned,
      contact: phoneCheck.cleaned,
      education: formData.education.trim(),
      profession: formData.occupation.trim(),
      income: formData.income || 'Not Specified',
      native: formData.native.trim(),
      city: formData.location.trim() || formData.native.trim() || 'Indore',
      state: 'Madhya Pradesh',
      location: formData.location.trim() || formData.native.trim(),
      about: `Maternal Gotra: ${formData.maternalGotra || 'Not specified'}. ${formData.bio}`,
      familyDetails: familyDetailsFormatted,
      photo: formData.photos[0] && formData.photos[0].trim() !== ''
        ? formData.photos[0].trim()
        : formData.gender === 'Female'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      gallery: formData.photos.length > 0 ? formData.photos : undefined,
      verified: true,
      createdAt: new Date().toISOString()
    };

    const added = onAddProfile(newProfile);
    if (added === false) {
      setFormError(t(
        'Only 1 profile can be created per login. You already have a published profile in your account.',
        'प्रति लॉगिन केवल 1 प्रोफ़ाइल बनाई जा सकती है। आपके खाते में पहले से एक प्रोफ़ाइल मौजूद है।'
      ));
      return;
    }
    onNavigateTab('dashboard');
  };

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
            <h2 className="text-2xl font-serif font-bold text-red-950">
              {t('Sign In to Create Profile', 'प्रोफ़ाइल बनाने के लिए लॉग इन करें')}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {t(
                'Please sign in first. Once signed in, you can create your profile, post business ads, and access all features.',
                'कृपया पहले लॉग इन करें। लॉग इन करने के बाद आप बायोडाटा बना सकते हैं, विज्ञापन दे सकते हैं और सभी सुविधाएं देख सकते हैं।'
              )}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button 
              type="button"
              onClick={handleDirectGoogleClick} 
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl shadow-xs transition-all text-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.23 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              {t('Continue with Google', 'Google के साथ जारी रखें')}
            </button>

            <button 
              type="button"
              onClick={() => onNavigateTab('signup')} 
              className="w-full bg-red-900 hover:bg-red-800 text-amber-100 font-bold py-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
            >
              {t('Sign In / Create Samaj Account', 'लॉग इन / नया समाज खाता बनाएं')}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            {t(
              'Publishing your profile also unlocks unlimited biodata views across the Rathore Samaj directory.',
              'अपनी प्रोफ़ाइल प्रकाशित करने से पूरे राठौड़ समाज डायरेक्टरी में असीमित बायोडाटा संपर्क अनलॉक होते हैं।'
            )}
          </div>
        </div>
      </div>
    );
  }

  if (hasRegisteredProfile || existingUserProfile) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white rounded-3xl border border-amber-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block bg-amber-100 text-amber-900 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-200">
              {t('1 Profile Per Login Limit Reached', 'प्रति लॉगिन 1 प्रोफ़ाइल सीमा पूर्ण')}
            </span>
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              {t('Profile Already Created for This Login', 'इस लॉगिन पर प्रोफ़ाइल पहले से बनी हुई है')}
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
              {t(
                'Each user login is allowed to publish 1 matrimonial profile to maintain directory authenticity. You can view, edit, or manage your profile from your Member Dashboard.',
                'प्रत्येक लॉगिन पर केवल 1 वैवाहिक प्रोफ़ाइल बनाने की अनुमति है। आप अपनी मौजूदा प्रोफ़ाइल को डैशबोर्ड से देख या संपादित कर सकते हैं।'
              )}
            </p>
          </div>

          {existingUserProfile && (
            <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4 flex items-center gap-4 text-left">
              <img
                src={existingUserProfile.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
                alt={existingUserProfile.name}
                className="w-14 h-14 rounded-xl object-cover object-top border border-amber-200 shrink-0"
              />
              <div className="min-w-0 flex-1 text-xs space-y-0.5">
                <p className="font-bold text-stone-900 text-sm truncate">{existingUserProfile.name}</p>
                <p className="text-stone-600">{existingUserProfile.age} {t('Yrs', 'वर्ष')} · {existingUserProfile.gotra} · {existingUserProfile.city}</p>
                <p className="text-stone-500 font-mono text-[11px]">{existingUserProfile.contact}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="flex-1 bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3 px-4 rounded-xl text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-300" />
              <span>{t('Manage / Edit My Profile', 'मेरी प्रोफ़ाइल संपादित करें')}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('matrimony')}
              className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{t('Browse Directory', 'बायोडाटा देखें')}</span>
            </button>
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
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> {t('Signed In', 'लॉग इन सक्रिय')}
              </span>
              <span className="text-xs text-stone-500">
                {authSession.name || `+91 ${authSession.phone}`}
              </span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {t('Create Matrimonial Profile', 'वैवाहिक प्रोफ़ाइल (बायोडाटा) बनाएं')}
            </h2>
            <p className="text-xs text-stone-500 font-light">
              {t(
                'Fill out your details to list your profile on Rathore Rishtey & unlock unlimited directory access.',
                'राठौड़ रिश्ते पोर्टल पर अपना बायोडाटा जोड़ने के लिए नीचे जानकारी भरें।'
              )}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => onNavigateTab('matrimony')} 
            className="text-xs text-stone-400 hover:text-stone-700 font-semibold p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors"
          >
            {t('Cancel ✕', 'रद्द करें ✕')}
          </button>
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Full Name *', 'पूरा नाम *')}
              </label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500" 
                placeholder={t('e.g., Rohit Rathore', 'उदा. रोहित राठौड़')} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Gender *', 'लिंग *')}
              </label>
              <select 
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="Male">{t('Male (Groom)', 'पुरुष (वर)')}</option>
                <option value="Female">{t('Female (Bride)', 'महिला (वधू)')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Date of Birth *', 'जन्म तिथि *')}
              </label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Birth Time', 'जन्म समय')}
              </label>
              <input 
                type="time" 
                name="birthTime"
                value={formData.birthTime}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Height', 'ऊँचाई (कद)')}
              </label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Gotra *', 'गोत्र *')}
              </label>
              <input 
                type="text" 
                name="gotra"
                value={formData.gotra}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder={t('e.g., Rathore / Solanki / Kadamaiye', 'उदा. पिंडोरिया / सोलंकी / इंदुके')} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t('Contact Number (10 Digits) *', 'संपर्क नंबर (10 अंक) *')}</span>
                <span className="text-[10px] font-mono text-stone-400">{formData.phone.length}/10</span>
              </label>
              <input 
                type="tel" 
                inputMode="numeric"
                maxLength={10}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required 
                className={`w-full border rounded-lg p-2.5 text-xs font-mono ${
                  phoneError ? 'border-rose-400 focus:ring-rose-500' : 'border-amber-300 focus:ring-amber-500'
                }`} 
                placeholder={t('10-digit real mobile number', '10 अंकों का वास्तविक मोबाइल नंबर')} 
              />
              {phoneError && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{phoneError}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Education *', 'शिक्षा *')}
              </label>
              <input 
                type="text" 
                name="education"
                value={formData.education}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder={t('e.g., B.Tech, MBA, Graduate', 'उदा. बी.टेक, एम.कॉम')} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Occupation *', 'व्यवसाय / नौकरी *')}
              </label>
              <input 
                type="text" 
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder={t('e.g., Software Engineer, Business', 'उदा. सॉफ्टवेयर इंजीनियर / व्यापार')} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Annual Income', 'वार्षिक / मासिक आय')}
              </label>
              <input 
                type="text" 
                name="income"
                value={formData.income}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder={t('e.g., 6 LPA', 'उदा. ₹6 लाख वार्षिक')} 
              />
            </div>
          </div>

          {/* FAMILY DETAILS SECTION */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
            <span className="font-bold text-red-950 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <Users className="w-4 h-4 text-amber-700" />
              {t('Family Details', 'पारिवारिक विवरण')}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("Father's Name", 'पिता का नाम')}
                </label>
                <input 
                  type="text" 
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="w-full border border-amber-300 rounded-lg p-2.5 text-xs bg-white" 
                  placeholder={t('e.g. Shri Ramchandra Rathore', 'उदा. श्री रामचंद्र राठौड़')} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("Father's Occupation", 'पिता का व्यवसाय')}
                </label>
                <input 
                  type="text" 
                  name="fatherOccupation"
                  value={formData.fatherOccupation}
                  onChange={handleChange}
                  className="w-full border border-amber-300 rounded-lg p-2.5 text-xs bg-white" 
                  placeholder={t('e.g. Business / Govt Service', 'उदा. व्यापार / शासकीय सेवा')} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("Mother's Name", 'माता का नाम')}
                </label>
                <input 
                  type="text" 
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  className="w-full border border-amber-300 rounded-lg p-2.5 text-xs bg-white" 
                  placeholder={t('e.g. Smt. Lata Rathore', 'उदा. श्रीमती लता राठौड़')} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("Maternal Gotra (Mama Gotra)", 'मामा गोत्र (ननिहाल)')}
                </label>
                <input 
                  type="text" 
                  name="maternalGotra"
                  value={formData.maternalGotra}
                  onChange={handleChange}
                  className="w-full border border-amber-300 rounded-lg p-2.5 text-xs bg-white" 
                  placeholder={t('e.g. Magroriya / Chauhan', 'उदा. मगरोरिया / भोजपुरिया')} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("Grandfather's Name", 'दादाजी का नाम')}
                </label>
                <input 
                  type="text" 
                  name="grandfatherName"
                  value={formData.grandfatherName}
                  onChange={handleChange}
                  className="w-full border border-amber-300 rounded-lg p-2.5 text-xs bg-white" 
                  placeholder={t('e.g. Late Shri Gangadharji Rathore', 'उदा. स्व. श्री गंगाधरजी राठौड़')} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('Siblings (Brothers / Sisters)', 'भाई / बहन')}
                </label>
                <input 
                  type="text" 
                  name="siblings"
                  value={formData.siblings}
                  onChange={handleChange}
                  className="w-full border border-amber-300 rounded-lg p-2.5 text-xs bg-white" 
                  placeholder={t('e.g. 1 brother, 1 sister', 'उदा. 1 भाई, 1 बहन')} 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Native Place / Hometown *', 'मूल निवास / जन्मस्थान *')}
              </label>
              <input 
                type="text" 
                name="native"
                value={formData.native}
                onChange={handleChange}
                required 
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder={t('e.g., Khargone, Indore', 'उदा. नांदेड़, इंदौर')} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('Current City / Location', 'वर्तमान शहर')}
              </label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
                placeholder={t('e.g., Pune', 'उदा. पुणे / छ. संभाजीनगर')} 
              />
            </div>
          </div>

          <MultiPhotoUploadField
            label={t('Candidate Photos (Upload 1 to 6 Photos)', 'प्रत्याशी की फ़ोटो (1 से 6 फ़ोटो अपलोड करें)')}
            photos={formData.photos}
            onChange={(nextPhotos) => setFormData((prev) => ({ ...prev, photos: nextPhotos }))}
            maxPhotos={6}
            maxDimension={720}
            helperText={t(
              'Select multiple portrait or traditional photos — Photo #1 is shown as the main profile picture',
              'एक से अधिक फ़ोटो चुनें — पहली फ़ोटो मुख्य प्रोफ़ाइल फ़ोटो के रूप में दिखेगी'
            )}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('About / Expectations / Bio *', 'परिचय / अपेक्षाएं *')}
            </label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3} 
              required 
              className="w-full border border-amber-300 rounded-lg p-2.5 text-xs" 
              placeholder={t(
                'Write briefly about education, family background, and expectations...',
                'शिक्षा, पारिवारिक पृष्ठभूमि और जीवनसाथी की अपेक्षाओं के बारे में संक्षेप में लिखें...'
              )} 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer border border-amber-400/30 hover:scale-[1.01]"
          >
            {t('Publish Profile to Directory & Unlock Contacts', 'प्रोफ़ाइल प्रकाशित करें और संपर्क अनलॉक करें')}
          </button>
        </form>
      </div>
    </div>
  );
};

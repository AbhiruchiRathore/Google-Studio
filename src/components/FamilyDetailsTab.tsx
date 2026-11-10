import React, { useState } from 'react';
import { 
  Users, Home, ShieldCheck, Phone, ArrowLeft, CheckCircle2, 
  Sparkles, User, AlertCircle
} from 'lucide-react';
import { TabType, AuthSession, MatrimonyProfile } from '../types';
import { sanitizePhoneInput, validatePhoneNumber } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';

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
  const { lang, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [primaryPhoneError, setPrimaryPhoneError] = useState<string | null>(null);
  const [secondaryPhoneError, setSecondaryPhoneError] = useState<string | null>(null);

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
    familyContact: sanitizePhoneInput(authSession?.phone || ''),
    secondaryContact: '',
    familyBackground: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.fatherName.trim() || !form.selfGotra.trim() || !form.nativePlace.trim()) {
      setErrorMsg(t(
        "Please fill in all mandatory fields: Father's Name, Self Gotra, Native Place, and Family Contact Number.",
        'कृपया सभी आवश्यक जानकारी भरें: पिता का नाम, स्वयं का गोत्र, मूल निवास और पारिवारिक मोबाइल नंबर।'
      ));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const primaryCheck = validatePhoneNumber(form.familyContact, true);
    if (!primaryCheck.valid) {
      const msg = lang === 'hi' ? (primaryCheck.errorHi || '') : (primaryCheck.errorEn || '');
      setPrimaryPhoneError(msg);
      setErrorMsg(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const secondaryCheck = validatePhoneNumber(form.secondaryContact, false);
    if (!secondaryCheck.valid) {
      const msg = lang === 'hi' ? (secondaryCheck.errorHi || '') : (secondaryCheck.errorEn || '');
      setSecondaryPhoneError(msg);
      setErrorMsg(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const candidateDisplayName = form.candidateName.trim() || `Son/Daughter of ${form.fatherName.trim()}`;
    const familyDetailsSummary = `Father: ${form.fatherName} (${form.fatherOccupation || 'Service/Business'}), Mother: ${form.motherName || 'Smt. Rathore'} (${form.motherOccupation || 'Homemaker'}), Grandfather: ${form.grandfatherName || 'Respected Elder'}. Siblings: ${form.brothers || '0'} brother(s), ${form.sisters || '0'} sister(s). Maternal Gotra: ${form.maternalGotra || 'Kshatriya Rathore'}. Native Place: ${form.nativePlace}.`;
    
    const contactString = secondaryCheck.cleaned
      ? `${primaryCheck.cleaned}, ${secondaryCheck.cleaned}`
      : primaryCheck.cleaned;

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
      phone: primaryCheck.cleaned,
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
              {t('Registration Successful', 'पंजीकरण सफल')}
            </span>
            <h2 className="text-3xl font-serif font-bold text-slate-900">
              {t('Family Details Added Successfully!', 'पारिवारिक विवरण सफलतापूर्वक जोड़ा गया!')}
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {t(
                "Your family's details have been registered into the Rathore Rishtey Digital Directory.",
                'आपके परिवार का विवरण राठौड़ रिश्ते डिजिटल डायरेक्टरी में दर्ज हो गया है।'
              )}
            </p>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-red-950">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{t('Unlimited Contact Unlocks Activated', 'असीमित संपर्क अनलॉक सक्रिय')}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {t(
                'In accordance with our community mutual-sharing policy, your profile is now active and you have unlocked full access to all candidate contacts and biodata details across the directory.',
                'समाज की पारस्परिक साझा नीति के अनुसार आपकी प्रोफ़ाइल सक्रिय हो गई है और अब आप सभी बायोडाटा और संपर्क देख सकते हैं।'
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => onNavigateTab('matrimony')}
              className="bg-red-900 hover:bg-red-800 text-amber-100 font-bold px-6 py-3 rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <Users className="w-4 h-4 text-amber-300" />
              {t('Browse All Matrimony Biodatas', 'सभी वैवाहिक बायोडाटा देखें')}
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
              className="bg-amber-100 hover:bg-amber-200 text-red-950 font-bold px-6 py-3 rounded-xl text-xs transition-colors cursor-pointer"
            >
              {t('Add Another Family Profile', 'एक और पारिवारिक प्रोफ़ाइल जोड़ें')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('matrimony')}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('Back to Directory', 'वापस डायरेक्टरी में जाएं')}
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
              {t('Add Family Details', 'पारिवारिक विवरण जोड़ें')}
            </h1>
            <p className="text-xs text-stone-500">
              {t(
                'Register your family lineage & biodata into the Rathore Samaj Matrimony Directory',
                'राठौड़ समाज वैवाहिक डायरेक्टरी में अपने परिवार व वंशावली का विवरण दर्ज करें'
              )}
            </p>
          </div>
        </div>

        {hasRegisteredProfile && (
          <span className="bg-emerald-50 text-emerald-800 font-semibold text-xs px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t('Family Profile Already Registered', 'पारिवारिक प्रोफ़ाइल पहले से पंजीकृत')}
          </span>
        )}
      </div>

      <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-amber-500/30 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold flex items-center justify-center text-2xl shadow-md shrink-0">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-serif font-bold text-amber-200 flex items-center justify-center sm:justify-start gap-2">
            {t('Why Register Family Details?', 'पारिवारिक विवरण क्यों दर्ज करें?')}
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed font-light">
            {t(
              'Our Samaj thrives on mutual trust and verified connections. By contributing your family details, your biodata is securely visible to verified community families, and you instantly unlock unlimited candidate contacts across India.',
              'हमारा समाज आपसी विश्वास और प्रमाणित रिश्तों से आगे बढ़ता है। अपना पारिवारिक विवरण साझा करने पर आप पूरे भारत के समाज परिवारों के संपर्क तुरंत देख सकते हैं।'
            )}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-stone-200/90 p-6 sm:p-8 space-y-6">
        
        {/* SECTION 1 */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
            <User className="w-4 h-4 text-red-900" />
            <h3 className="font-bold text-red-950 text-sm uppercase tracking-wider">
              {t('1. Candidate Details', '1. प्रत्याशी का विवरण')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Candidate Full Name', 'प्रत्याशी का पूरा नाम')}
              </label>
              <input 
                type="text" 
                value={form.candidateName}
                onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Rahul Rathore / Priya Rathore', 'उदा. राहुल राठौड़ / प्रिया राठौड़')} 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Gender *', 'लिंग *')}
              </label>
              <select 
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'Male' | 'Female' })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Male">{t('Groom (Male)', 'वर (पुरुष)')}</option>
                <option value="Female">{t('Bride (Female)', 'वधू (महिला)')}</option>
              </select>
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Age in Years', 'आयु (वर्षों में)')}
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

        {/* SECTION 2 */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
            <Home className="w-4 h-4 text-red-900" />
            <h3 className="font-bold text-red-950 text-sm uppercase tracking-wider">
              {t('2. Parents & Grandfather Details', '2. माता-पिता व दादाजी का विवरण')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t("Father's Name", 'पिता का नाम')} <span className="text-red-600">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Shri Mohanlal Rathore', 'उदा. श्री मोहनलाल राठौड़')} 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t("Father's Occupation", 'पिता का व्यवसाय')}
              </label>
              <input 
                type="text" 
                value={form.fatherOccupation}
                onChange={(e) => setForm({ ...form, fatherOccupation: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Business / Govt. Service / Retired', 'उदा. व्यापार / सरकारी नौकरी / सेवानिवृत्त')} 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t("Mother's Name", 'माता का नाम')}
              </label>
              <input 
                type="text" 
                value={form.motherName}
                onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Smt. Kamala Rathore', 'उदा. श्रीमती कमला राठौड़')} 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t("Mother's Status / Occupation", 'माता का कार्य')}
              </label>
              <input 
                type="text" 
                value={form.motherOccupation}
                onChange={(e) => setForm({ ...form, motherOccupation: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Homemaker / Teacher', 'उदा. गृहिणी / शिक्षिका')} 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold block text-slate-700 mb-1.5">
                {t("Grandfather's Name", 'दादाजी का नाम')}
              </label>
              <input 
                type="text" 
                value={form.grandfatherName}
                onChange={(e) => setForm({ ...form, grandfatherName: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Late Shri Govindramji Rathore', 'उदा. स्व. श्री गोविंदरामजी राठौड़')} 
              />
            </div>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
            <ShieldCheck className="w-4 h-4 text-red-900" />
            <h3 className="font-bold text-red-950 text-sm uppercase tracking-wider">
              {t('3. Gotra & Clan Details', '3. गोत्र व कुल विवरण')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Self Gotra', 'स्वयं का गोत्र')} <span className="text-red-600">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={form.selfGotra}
                onChange={(e) => setForm({ ...form, selfGotra: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Kadamaiye / Solanki / Pindoria', 'उदा. पिंडोरिया / सोलंकी / इंदुके')} 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Maternal Gotra', 'मामा गोत्र')}
              </label>
              <input 
                type="text" 
                value={form.maternalGotra}
                onChange={(e) => setForm({ ...form, maternalGotra: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Magroriya / Chauhan', 'उदा. मगरोरिया / भोजपुरिया')} 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Kuldevi / Kuldevta', 'कुलदेवी / कुलदेवता')}
              </label>
              <input 
                type="text" 
                value={form.kuldevi}
                onChange={(e) => setForm({ ...form, kuldevi: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Maa Chamunda / Maa Nagnechiya', 'उदा. माँ चामुंडा / माँ नागणेचिया')} 
              />
            </div>
          </div>
        </div>

        {/* SECTION 4 */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
            <Users className="w-4 h-4 text-red-900" />
            <h3 className="font-bold text-red-950 text-sm uppercase tracking-wider">
              {t('4. Siblings Details', '4. भाई-बहन का विवरण')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Brothers', 'भाई')}
              </label>
              <input 
                type="text" 
                value={form.brothers}
                onChange={(e) => setForm({ ...form, brothers: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. 1 elder brother (married)', 'उदा. 1 बड़ा भाई (विवाहित)')} 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Sisters', 'बहन')}
              </label>
              <input 
                type="text" 
                value={form.sisters}
                onChange={(e) => setForm({ ...form, sisters: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. 1 younger sister (unmarried)', 'उदा. 1 छोटी बहन (अविवाहित)')} 
              />
            </div>
          </div>
        </div>

        {/* SECTION 5 */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
            <Phone className="w-4 h-4 text-red-900" />
            <h3 className="font-bold text-red-950 text-sm uppercase tracking-wider">
              {t('5. Hometown & Contact Information', '5. मूल स्थान और संपर्क जानकारी')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Native Place / Hometown', 'मूल निवास')} <span className="text-red-600">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={form.nativePlace}
                onChange={(e) => setForm({ ...form, nativePlace: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Khargone / Akot / Ratlam', 'उदा. खरगोन / अकोट / नांदेड़')} 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Current City of Residence', 'वर्तमान निवास शहर')}
              </label>
              <input 
                type="text" 
                value={form.currentCity}
                onChange={(e) => setForm({ ...form, currentCity: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('e.g. Indore / Bhopal / Pune', 'उदा. इंदौर / भोपाल / पुणे')} 
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('State', 'राज्य')}
              </label>
              <input 
                type="text" 
                value={form.currentState}
                onChange={(e) => setForm({ ...form, currentState: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t('Madhya Pradesh', 'मध्य प्रदेश / महाराष्ट्र')} 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold block text-slate-700 mb-1.5 flex items-center justify-between">
                <span>
                  {t('Primary Family Phone & WhatsApp (10 Digits)', 'मुख्य पारिवारिक मोबाइल / व्हाट्सऐप (10 अंक)')}{' '}
                  <span className="text-red-600">*</span>
                </span>
                <span className="text-[10px] font-mono text-stone-400">{form.familyContact.length}/10</span>
              </label>
              <input 
                required 
                type="tel" 
                inputMode="numeric"
                maxLength={10}
                value={form.familyContact}
                onChange={(e) => {
                  const cleaned = sanitizePhoneInput(e.target.value);
                  setForm({ ...form, familyContact: cleaned });
                  if (cleaned.length > 0) {
                    const check = validatePhoneNumber(cleaned, true);
                    setPrimaryPhoneError(check.valid ? null : (lang === 'hi' ? check.errorHi || null : check.errorEn || null));
                  } else {
                    setPrimaryPhoneError(null);
                  }
                }}
                className={`w-full p-2.5 border rounded-xl bg-white font-mono focus:ring-2 focus:outline-none ${
                  primaryPhoneError ? 'border-rose-400 focus:ring-rose-500' : 'border-amber-300 focus:ring-amber-500'
                }`}
                placeholder={t('10-digit mobile number (e.g. 9826012345)', '10 अंकों का मोबाइल नंबर (उदा. 9826012345)')} 
              />
              {primaryPhoneError && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{primaryPhoneError}</p>
              )}
            </div>

            <div>
              <label className="font-bold block text-slate-700 mb-1.5 flex items-center justify-between">
                <span>{t('Secondary Phone (Optional)', 'दूसरा नंबर (वैकल्पिक)')}</span>
                <span className="text-[10px] font-mono text-stone-400">{form.secondaryContact.length}/10</span>
              </label>
              <input 
                type="tel" 
                inputMode="numeric"
                maxLength={10}
                value={form.secondaryContact}
                onChange={(e) => {
                  const cleaned = sanitizePhoneInput(e.target.value);
                  setForm({ ...form, secondaryContact: cleaned });
                  if (cleaned.length > 0) {
                    const check = validatePhoneNumber(cleaned, false);
                    setSecondaryPhoneError(check.valid ? null : (lang === 'hi' ? check.errorHi || null : check.errorEn || null));
                  } else {
                    setSecondaryPhoneError(null);
                  }
                }}
                className={`w-full p-2.5 border rounded-xl bg-white font-mono focus:ring-2 focus:outline-none ${
                  secondaryPhoneError ? 'border-rose-400 focus:ring-rose-500' : 'border-amber-300 focus:ring-amber-500'
                }`}
                placeholder={t('10-digit optional', '10 अंक (वैकल्पिक)')} 
              />
              {secondaryPhoneError && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{secondaryPhoneError}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label className="font-bold block text-slate-700 mb-1.5">
                {t('Family Status & Background Notes', 'पारिवारिक स्थिति व पृष्ठभूमि')}
              </label>
              <textarea 
                rows={3}
                value={form.familyBackground}
                onChange={(e) => setForm({ ...form, familyBackground: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                placeholder={t(
                  'e.g. Respectable Kshatriya Rathore family, traditional values...',
                  'उदा. प्रतिष्ठित राठौड़ परिवार, संयुक्त परिवार एवं पारंपरिक संस्कार...'
                )} 
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
            {t('Publish Family Details & Unlock All Biodatas', 'पारिवारिक विवरण प्रकाशित करें और सभी बायोडाटा अनलॉक करें')}
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('matrimony')}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3.5 px-6 rounded-2xl text-xs transition-colors cursor-pointer"
          >
            {t('Cancel', 'रद्द करें')}
          </button>
        </div>
      </form>
    </div>
  );
};

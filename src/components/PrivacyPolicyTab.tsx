import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, Database, Trash2, Mail, Users } from 'lucide-react';
import { TabType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PrivacyPolicyTabProps {
  onNavigateTab: (tab: TabType) => void;
}

export const PrivacyPolicyTab: React.FC<PrivacyPolicyTabProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('matrimony')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('Back to Home', 'होम पर वापस जाएं')}</span>
        </button>
        <span className="text-[11px] text-stone-500 font-medium">
          {t('Effective Date: November 14, 2026', 'प्रभावी तिथि: १४ नवंबर २०२६')}
        </span>
      </div>

      <article className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-10 space-y-8 text-stone-700">
        <header className="border-b border-stone-100 pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#6e1628] text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('Privacy Policy', 'गोपनीयता नीति')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {t('Rathore Rishtey — Privacy Policy', 'राठौड़ रिश्ते — गोपनीयता नीति')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            {t(
              'Rathore Rishtey ("we", "our", or "the Portal") is committed to protecting the privacy and personal information of Rathore Samaj members, families, and community business owners.',
              'राठौड़ रिश्ते पोर्टल राठौड़ समाज के सदस्यों, परिवारों और व्यापार मालिकों की व्यक्तिगत जानकारी और गोपनीयता की सुरक्षा के लिए प्रतिबद्ध है।'
            )}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#851834]" />
            <span>{t('1. Information We Collect', '१. हम कौन सी जानकारी एकत्र करते हैं')}</span>
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm leading-relaxed text-stone-600">
            <li>
              {t(
                'Account & Authentication Details: Full name, username ID, email address, optional mobile number, and Google Sign-In profile information (name, email, avatar) managed via Firebase Authentication.',
                'खाता और लॉगिन विवरण: पूरा नाम, यूज़रनेम आईडी, ईमेल पता, वैकल्पिक मोबाइल नंबर, और Google साइन-इन प्रोफ़ाइल जानकारी (नाम, ईमेल, फोटो) जो Firebase Authentication द्वारा सुरक्षित रहती है।'
              )}
            </li>
            <li>
              {t(
                'Matrimonial Biodata Information: Candidate name, age, gender, gotra, height, education, profession, city/state, family details, birth date/time (for Kundali Milan), photos, and guardian contact numbers voluntarily submitted by members.',
                'वैवाहिक बायोडाटा जानकारी: उम्मीदवार का नाम, आयु, लिंग, गोत्र, कद, शिक्षा, व्यवसाय, शहर/राज्य, पारिवारिक विवरण, जन्म तिथि/समय (कुंडली मिलान हेतु), फोटो और संपर्क नंबर।'
              )}
            </li>
            <li>
              {t(
                'Business Directory Listings: Shop/business name, owner name, category, address, contact numbers, offers, and promotional images submitted for listing in the Samaj Business Directory.',
                'व्यापार निर्देशिका विवरण: दुकान/व्यापार का नाम, मालिक का नाम, श्रेणी, पता, संपर्क नंबर और विज्ञापन फोटो।'
              )}
            </li>
            <li>
              {t(
                'Guest List Planner & App Preferences: Event guest entries and language settings saved locally on your device for convenient offline/fast access.',
                'अतिथि सूची प्लानर और भाषा प्राथमिकताएं जो आपके डिवाइस में सुरक्षित रहती हैं।'
              )}
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#851834]" />
            <span>{t('2. How We Use & Store Information', '२. जानकारी का उपयोग और संग्रहण')}</span>
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm leading-relaxed text-stone-600">
            <li>
              {t(
                'To authenticate your account securely using Google Sign-In or Username/Email & Password and send password reset links strictly to your verified email address.',
                'Google साइन-इन या यूज़रनेम/ईमेल और पासवर्ड द्वारा सुरक्षित लॉगिन प्रदान करने और केवल आपके पंजीकृत ईमेल पर पासवर्ड रीसेट लिंक भेजने के लिए।'
              )}
            </li>
            <li>
              {t(
                'To display verified matrimonial biodatas, Kundali Guna Milan compatibility calculations, and Samaj business listings within the community portal.',
                'सत्यापित वैवाहिक बायोडाटा, कुंडली मिलान (३६ गुण) और समाज व्यापार निर्देशिका दिखाने के लिए।'
              )}
            </li>
            <li>
              {t(
                'Authentication credentials and user profile metadata are stored securely using Google Firebase Authentication and Cloud Firestore. Raw passwords are never stored in plain text inside Firestore.',
                'लॉगिन विवरण और प्रोफ़ाइल डेटा Google Firebase Authentication व Cloud Firestore में सुरक्षित रखे जाते हैं।'
              )}
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#851834]" />
            <span>{t('3. Data Sharing & Security', '३. डेटा सुरक्षा और साझाकरण')}</span>
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-stone-600">
            {t(
              'We do not sell, rent, or trade your personal information to third-party advertisers or data brokers. Profile information submitted for matrimonial matching or business promotion is visible to community members on the portal according to portal verification rules. All network traffic between your device and Firebase servers is encrypted over HTTPS/TLS.',
              'हम आपकी व्यक्तिगत जानकारी किसी भी बाहरी विज्ञापनदाता को नहीं बेचते या साझा नहीं करते। वैवाहिक या व्यापारिक विवरण केवल समाज पोर्टल के नियमों के अनुसार दिखाए जाते हैं, और सभी डेटा HTTPS/TLS एन्क्रिप्शन द्वारा सुरक्षित रहते हैं।'
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#851834]" />
            <span>{t('4. Your Rights & Account Deletion', '४. आपके अधिकार और खाता हटाना')}</span>
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-stone-600">
            {t(
              'You may edit or delete your matrimonial biodata and business advertisements directly from your Member Dashboard at any time. To request permanent deletion of your Firebase account or stored profile data, please contact us using the email below.',
              'आप किसी भी समय अपने सदस्य डैशबोर्ड से अपना बायोडाटा या व्यापार विज्ञापन संपादित या हटा सकते हैं। अपना खाता स्थायी रूप से हटाने के लिए नीचे दिए गए ईमेल पर संपर्क करें।'
            )}
          </p>
        </section>

        <section className="space-y-2 bg-stone-50 border border-stone-200 rounded-2xl p-5">
          <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#851834]" />
            <span>{t('5. Contact & Privacy Support', '५. संपर्क एवं सहायता')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {t(
              'For any privacy questions, data correction, or account deletion requests regarding Rathore Rishtey:',
              'राठौड़ रिश्ते से संबंधित किसी भी गोपनीयता प्रश्न या डेटा सुधार/हटाने के अनुरोध के लिए संपर्क करें:'
            )}
          </p>
          <p className="text-xs sm:text-sm font-semibold text-[#6e1628]">
            Email:{' '}
            <a href="mailto:abhiruchirathore97@gmail.com" className="underline hover:text-[#851834]">
              abhiruchirathore97@gmail.com
            </a>
          </p>
        </section>
      </article>
    </div>
  );
};

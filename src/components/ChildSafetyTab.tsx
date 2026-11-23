import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Mail,
  Ban,
  Flag,
  Scale,
  UserCheck,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { TabType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  buildGmailComposeUrl,
  isAndroidDevice,
  isAndroidWebView
} from '../utils/shareAndPrint';

const SAFETY_CONTACT_EMAIL = 'abhiruchirathore97@gmail.com';

interface ChildSafetyTabProps {
  onNavigateTab: (tab: TabType) => void;
}

export const ChildSafetyTab: React.FC<ChildSafetyTabProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();
  const [copiedField, setCopiedField] = useState<'url' | 'email' | null>(null);

  const policyPageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/child-safety`
      : '/child-safety';

  const emailSubjectText = 'Urgent: Child Safety / CSAE Report - Rathore Rishtey';
  const emailBodyText = [
    'Hello Rathore Rishtey Child Safety & Moderation Team,',
    '',
    'I would like to report a child safety concern, suspected minor profile, or policy violation:',
    '',
    'Profile Name / ID (if known): ',
    'Description of Concern: ',
    '',
    'Please review and take immediate action.'
  ].join('\n');
  const mailtoHref = `mailto:${SAFETY_CONTACT_EMAIL}?subject=${encodeURIComponent(emailSubjectText)}&body=${encodeURIComponent(emailBodyText)}`;
  const isAndroid = isAndroidDevice() || isAndroidWebView();
  const primaryEmailHref = isAndroid
    ? buildGmailComposeUrl({ to: SAFETY_CONTACT_EMAIL, subject: emailSubjectText, body: emailBodyText })
    : mailtoHref;
  const directEmailHref = isAndroid
    ? buildGmailComposeUrl({ to: SAFETY_CONTACT_EMAIL })
    : `mailto:${SAFETY_CONTACT_EMAIL}`;

  const handleCopy = async (value: string, field: 'url' | 'email') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedField(field);
        window.setTimeout(() => {
          setCopiedField((prev) => (prev === field ? null : prev));
        }, 2200);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('matrimony')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('Back to Home', 'होम पर वापस जाएं')}</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] text-stone-500 font-medium">
          <a
            href="/privacy-policy"
            onClick={(e) => {
              e.preventDefault();
              onNavigateTab('privacy-policy');
            }}
            className="text-[#6e1628] hover:text-[#851834] font-semibold underline"
          >
            {t('Privacy Policy', 'गोपनीयता नीति')}
          </a>
          <span>•</span>
          <a
            href="/delete-account"
            onClick={(e) => {
              e.preventDefault();
              onNavigateTab('delete-account');
            }}
            className="text-[#6e1628] hover:text-[#851834] font-semibold underline"
          >
            {t('Delete Account', 'खाता हटाएं')}
          </a>
          <span>•</span>
          <span>{t('Updated: November 19, 2026', 'अद्यतन: १९ नवंबर २०२६')}</span>
        </div>
      </div>

      {/* Main Policy Document */}
      <article className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-10 space-y-8 text-stone-700">
        {/* Header */}
        <header className="border-b border-stone-100 pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#6e1628] text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('Child Safety Standards Policy', 'बाल सुरक्षा मानक नीति')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {t(
              'Rathore Rishtey — Child Safety Standards & CSAE Prevention Policy',
              'राठौड़ रिश्ते — बाल सुरक्षा मानक एवं सुरक्षा नीति'
            )}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {t(
              'Rathore Rishtey maintains a strict, zero-tolerance commitment to protecting children and preventing Child Sexual Abuse and Exploitation (CSAE) and Child Sexual Abuse Material (CSAM). This policy applies to all users, profiles, messages, images, and listings across the Rathore Rishtey mobile application and web portal.',
              'राठौड़ रिश्ते बच्चों की सुरक्षा और किसी भी प्रकार के बाल शोषण (CSAE/CSAM) की रोकथाम के लिए शून्य-सहिष्णुता (Zero Tolerance) नीति का पालन करता है। यह नीति ऐप और वेब पोर्टल के सभी उपयोगकर्ताओं, प्रोफ़ाइल, संदेशों और फोटो पर लागू होती है।'
            )}
          </p>

          {/* Shareable Public URL Bar for Google Play Console */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">
                {t('Published Child Safety Standards URL (Play Console)', 'प्रकाशित बाल सुरक्षा नीति वेब लिंक')}
              </span>
              <span className="font-mono text-stone-800 break-all">{policyPageUrl}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleCopy(policyPageUrl, 'url')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-stone-300 text-stone-700 font-semibold text-xs shrink-0 cursor-pointer transition-colors"
            >
              {copiedField === 'url' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{t('Copied', 'कॉपी हुआ')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('Copy Link', 'लिंक कॉपी करें')}</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* 1. Zero Tolerance Against CSAE & CSAM */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
            <span>
              {t(
                '1. Zero-Tolerance Policy Against CSAE and CSAM',
                '१. बाल यौन शोषण (CSAE एवं CSAM) के प्रति शून्य-सहिष्णुता नीति'
              )}
            </span>
          </h2>
          <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm text-stone-700 leading-relaxed">
            <p className="font-semibold text-red-950">
              {t(
                'Rathore Rishtey strictly prohibits any content, behavior, solicitation, or communication that exploits, harms, grooms, or endangers minors.',
                'राठौड़ रिश्ते नाबालिगों का शोषण, नुकसान या अनुचित संपर्क करने वाली किसी भी सामग्री या व्यवहार पर पूर्ण प्रतिबंध लगाता है।'
              )}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-stone-600">
              <li>
                {t(
                  'Uploading, sharing, requesting, or transmitting Child Sexual Abuse Material (CSAM) or any sexualized depiction involving minors is strictly forbidden.',
                  'किसी भी रूप में बाल शोषण सामग्री (CSAM) या नाबालिगों से संबंधित आपत्तिजनक सामग्री अपलोड या साझा करना सख्त वर्जित है।'
                )}
              </li>
              <li>
                {t(
                  'Grooming, trafficking, sextortion, predatory solicitation, or attempting to arrange inappropriate contact with minors via chat, phone, or WhatsApp will result in immediate permanent account termination and reporting to authorities.',
                  'चैट, फोन या व्हाट्सएप के माध्यम से किसी भी प्रकार के अनुचित संपर्क या शोषण के प्रयास पर खाता तुरंत स्थायी रूप से बंद कर दिया जाएगा और कानून प्रवर्तन को सूचित किया जाएगा।'
                )}
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Strictly Adult-Only Matrimony Platform (18+ / Legal Age) */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#851834] shrink-0" />
            <span>
              {t(
                '2. Strict Age Eligibility (Adults 18+ Only & Anti-Child Marriage)',
                '२. आयु पात्रता नियम (केवल वयस्क १८+ एवं बाल विवाह निषेध)'
              )}
            </span>
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm leading-relaxed text-stone-600">
            <li>
              {t(
                'Rathore Rishtey is strictly intended for adults aged 18 years and older seeking lawful matrimonial alliances.',
                'राठौड़ रिश्ते केवल १८ वर्ष और उससे अधिक आयु के वयस्कों के वैध वैवाहिक संबंधों के लिए है।'
              )}
            </li>
            <li>
              {t(
                'Minors (individuals under 18 years of age) are not permitted to register accounts, publish matrimonial biodatas, or use communication features on the platform.',
                '१८ वर्ष से कम आयु के नाबालिगों को खाता बनाने, वैवाहिक बायोडाटा प्रकाशित करने या चैट सुविधाओं का उपयोग करने की अनुमति नहीं है।'
              )}
            </li>
            <li>
              {t(
                'In compliance with Indian law (Prohibition of Child Marriage Act), profiles must represent adults of legal marriageable age (minimum 18 years for brides and 21 years for grooms). Any underage profile discovered or reported is immediately removed.',
                'भारतीय कानून (बाल विवाह निषेध अधिनियम) के अनुसार वैवाहिक बायोडाटा कानूनी विवाह योग्य आयु (वधु न्यूनतम १८ वर्ष एवं वर न्यूनतम २१ वर्ष) का होना अनिवार्य है। कम आयु की किसी भी प्रोफ़ाइल को तुरंत हटा दिया जाता है।'
              )}
            </li>
          </ul>
        </section>

        {/* 3. In-App Reporting, Blocking & Prevention Controls */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#851834] shrink-0" />
            <span>
              {t(
                '3. In-App Safety, Blocking & User Reporting',
                '३. ऐप के भीतर सुरक्षा, ब्लॉक और रिपोर्टिंग तंत्र'
              )}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2 text-xs">
              <p className="font-bold text-stone-900 flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{t('Instant User Blocking', 'तुरंत प्रोफ़ाइल ब्लॉक करें')}</span>
              </p>
              <p className="text-stone-600 leading-relaxed">
                {t(
                  'Signed-in members can immediately block any suspicious or unwanted profile directly from the Chat screen, Biodata modal, or Match cards. Blocked profiles are instantly hidden from matches, likes, admirers, and chats.',
                  'लॉग इन सदस्य चैट स्क्रीन, बायोडाटा या प्रोफ़ाइल कार्ड से किसी भी संदिग्ध प्रोफ़ाइल को तुरंत ब्लॉक कर सकते हैं, जिससे वह सभी सूचियों और चैट से हट जाती है।'
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2 text-xs">
              <p className="font-bold text-stone-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t('Report Abuse or Underage Profiles', 'दुरुपयोग या कम आयु प्रोफ़ाइल की रिपोर्ट करें')}</span>
              </p>
              <p className="text-stone-600 leading-relaxed">
                {t(
                  'Users can report any suspected minor profile, CSAM/CSAE violation, harassment, or unsafe behavior immediately to our Child Safety Officer using the direct contact channel below. Reports are prioritized for urgent moderation review.',
                  'उपयोगकर्ता किसी भी संदिग्ध कम आयु प्रोफ़ाइल, उत्पीड़न या सुरक्षा उल्लंघन की तुरंत नीचे दिए गए संपर्क ईमेल पर रिपोर्ट कर सकते हैं।'
                )}
              </p>
            </div>
          </div>
        </section>

        {/* 4. Enforcement, Legal Compliance & Reporting to Authorities */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#851834] shrink-0" />
            <span>
              {t(
                '4. Moderation Action & Law Enforcement Reporting',
                '४. मॉडरेशन कार्रवाई एवं कानून प्रवर्तन को सूचना'
              )}
            </span>
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm leading-relaxed text-stone-600">
            <li>
              {t(
                'Swift Removal & Account Ban: Upon detecting or receiving a credible report of CSAM, CSAE, or minor exploitation, we immediately remove the offending content, terminate the user account permanently, and block associated credentials.',
                'त्वरित निष्कासन और प्रतिबंध: बाल शोषण या कम आयु उल्लंघन की सूचना मिलते ही संबंधित सामग्री हटा दी जाती है और उपयोगकर्ता का खाता स्थायी रूप से बंद कर दिया जाता है।'
              )}
            </li>
            <li>
              {t(
                'Compliance & Authorities: Rathore Rishtey complies fully with all applicable child safety laws—including the Protection of Children from Sexual Offences (POCSO) Act, Information Technology Act, and Google Play Child Safety Standards—and reports confirmed CSAM/CSAE violations to relevant regional and national authorities, including the Indian Cyber Crime Coordination Centre (I4C / cybercrime.gov.in), NCPCR, and NCMEC as required by law.',
                'कानूनी अनुपालन: राठौड़ रिश्ते POCSO अधिनियम, आईटी अधिनियम और Google Play बाल सुरक्षा मानकों का पूर्ण पालन करता है तथा पुष्टि हुए मामलों की सूचना cybercrime.gov.in (I4C), NCPCR और NCMEC सहित सक्षम कानून प्रवर्तन एजेंसियों को देता है।'
              )}
            </li>
          </ul>
        </section>

        {/* 5. Child Safety Point of Contact */}
        <section className="space-y-3 bg-rose-50/50 border border-rose-200 rounded-2xl p-5">
          <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#851834] shrink-0" />
            <span>{t('5. Child Safety Point of Contact', '५. बाल सुरक्षा संपर्क अधिकारी')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {t(
              'For urgent child safety concerns, CSAE/CSAM reports, underage profile removal requests, or inquiries from law enforcement and Google Play reviewers, please contact our designated Child Safety Officer:',
              'किसी भी बाल सुरक्षा चिंता, आपत्तिजनक सामग्री की रिपोर्ट, कम आयु प्रोफ़ाइल हटाने के अनुरोध या कानूनी पूछताछ के लिए हमारे बाल सुरक्षा संपर्क अधिकारी से संपर्क करें:'
            )}
          </p>

          <div className="bg-white rounded-xl border border-rose-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-stone-900">
                {t('Rathore Rishtey Child Safety & Moderation Team', 'राठौड़ रिश्ते बाल सुरक्षा एवं मॉडरेशन टीम')}
              </p>
              <p className="font-semibold text-[#6e1628]">
                Email:{' '}
                <a
                  href={directEmailHref}
                  target={isAndroid ? '_blank' : undefined}
                  rel={isAndroid ? 'noopener noreferrer' : undefined}
                  className="underline hover:text-[#851834]"
                >
                  {SAFETY_CONTACT_EMAIL}
                </a>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleCopy(SAFETY_CONTACT_EMAIL, 'email')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs cursor-pointer"
              >
                {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'email' ? t('Copied', 'कॉपी हुआ') : t('Copy Email', 'ईमेल कॉपी करें')}</span>
              </button>

              <a
                href={primaryEmailHref}
                target={isAndroid ? '_blank' : undefined}
                rel={isAndroid ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-100 font-bold text-xs shadow-xs hover:opacity-95 transition-opacity"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{t('Report Safety Concern', 'सुरक्षा रिपोर्ट भेजें')}</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            </div>
          </div>
        </section>

        {/* Bottom Cross-links */}
        <footer className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#851834]" />
            <span>{t('Related Compliance Policies:', 'संबंधित नीतियां:')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/privacy-policy"
              onClick={(e) => {
                e.preventDefault();
                onNavigateTab('privacy-policy');
              }}
              className="text-[#6e1628] hover:text-[#851834] font-bold underline"
            >
              {t('Privacy Policy', 'गोपनीयता नीति')}
            </a>
            <a
              href="/delete-account"
              onClick={(e) => {
                e.preventDefault();
                onNavigateTab('delete-account');
              }}
              className="text-[#6e1628] hover:text-[#851834] font-bold underline"
            >
              {t('Account Deletion', 'खाता विलोपन')}
            </a>
          </div>
        </footer>
      </article>
    </div>
  );
};

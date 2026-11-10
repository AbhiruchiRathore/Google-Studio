import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Edit3, Trash2, Share2, 
  Printer, CheckCircle2, Clock, X, Send, 
  Calendar, AlertCircle
} from 'lucide-react';
import { GuestItem, GuestListOccasion, TabType, AuthSession } from '../types';
import { sanitizePhoneInput, validatePhoneNumber } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';

interface GuestListTabProps {
  authSession: AuthSession | null;
  onNavigateTab: (tab: TabType) => void;
}

const DEFAULT_OCCASIONS: GuestListOccasion[] = [
  {
    id: 'occ-1',
    title: 'Shubh Vivah (Wedding & Reception Guest List)',
    date: '2026-12-11',
    venue: 'Royal Rajput Palace & Banquet Hall, Indore',
    description: 'Central wedding reception, baraat and community feast guest list.',
    createdAt: '2026-10-15',
    guests: [
      {
        id: 'g-1',
        name: 'Kunwar Mahendra Singh Rathore',
        phone: '9826012345',
        address: 'Bunglow No. 14, Rajendra Nagar, Indore, MP',
        city: 'Indore',
        category: 'Family/Relatives',
        membersCount: 4,
        status: 'Confirmed',
        notes: 'Elder family uncle. Arriving 1 day prior by train.'
      },
      {
        id: 'g-2',
        name: 'Thakur Dilip Singh Sisodiya',
        phone: '9420348499',
        address: 'Sharda Chowk, MG Road, Nanded, MH',
        city: 'Nanded',
        category: 'Bride Side',
        membersCount: 3,
        status: 'Card Sent',
        notes: 'Maternal uncle (Mama Ji).'
      },
      {
        id: 'g-3',
        name: 'Bhawani Singh Tanwar',
        phone: '9359607476',
        address: 'Hiralal Chowk, Subhash Road, Beed, MH',
        city: 'Beed',
        category: 'Groom Side',
        membersCount: 2,
        status: 'Confirmed',
        notes: 'Room reservation required at venue hotel.'
      },
      {
        id: 'g-4',
        name: 'Dr. Rupnarayan Rathore & Family',
        phone: '9754916285',
        address: 'Kalindi Gold, Arvind Hospital Road, Indore, MP',
        city: 'Indore',
        category: 'Samaj Dignitaries',
        membersCount: 5,
        status: 'Confirmed',
        notes: 'Samaj Samiti Vice President.'
      },
      {
        id: 'g-5',
        name: 'Kailashchandra Rathore',
        phone: '9822084717',
        address: 'Ganga City Housing, Nanded, MH',
        city: 'Nanded',
        category: 'Friends',
        membersCount: 2,
        status: 'Pending',
        notes: 'Call to confirm arrival date.'
      }
    ]
  },
  {
    id: 'occ-2',
    title: 'Sagai & Roka Ceremony (Engagement)',
    date: '2026-11-28',
    venue: 'Samaj Kalyan Bhavan, Nanded',
    description: 'Close family engagement and Gotra milan ceremony.',
    createdAt: '2026-10-20',
    guests: [
      {
        id: 'g-201',
        name: 'Suresh Nemichand Rathore',
        phone: '7489803745',
        address: 'Kazipura, Jalna, MH',
        city: 'Jalna',
        category: 'Family/Relatives',
        membersCount: 4,
        status: 'Confirmed',
        notes: 'Close relatives from Jalna.'
      },
      {
        id: 'g-202',
        name: 'Jitendra Laxminarayan Rathore',
        phone: '9881905051',
        address: 'Janakinagar, Pimpalgaon Road, Beed, MH',
        city: 'Beed',
        category: 'Bride Side',
        membersCount: 3,
        status: 'Card Sent',
        notes: 'Formal wedding patrika handed over.'
      }
    ]
  }
];

export const GuestListTab: React.FC<GuestListTabProps> = () => {
  const { lang, t } = useLanguage();

  const [occasions, setOccasions] = useState<GuestListOccasion[]>(() => {
    try {
      const stored = localStorage.getItem('samaj_saved_guest_lists');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_OCCASIONS;
  });

  const [activeOccasionId, setActiveOccasionId] = useState<string>(() => {
    return occasions[0]?.id || 'occ-1';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestItem | null>(null);
  const [guestFormError, setGuestFormError] = useState<string | null>(null);
  const [showNewOccasionModal, setShowNewOccasionModal] = useState(false);
  const [newOccasionTitle, setNewOccasionTitle] = useState('');
  const [newOccasionDate, setNewOccasionDate] = useState('');
  const [newOccasionVenue, setNewOccasionVenue] = useState('');

  const [guestForm, setGuestForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    category: 'Family/Relatives' as GuestItem['category'],
    membersCount: 2,
    status: 'Pending' as GuestItem['status'],
    notes: ''
  });

  const saveOccasions = (updated: GuestListOccasion[]) => {
    setOccasions(updated);
    try {
      localStorage.setItem('samaj_saved_guest_lists', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const activeOccasion = useMemo(() => {
    return occasions.find(o => o.id === activeOccasionId) || occasions[0];
  }, [occasions, activeOccasionId]);

  const filteredGuests = useMemo(() => {
    if (!activeOccasion) return [];
    return activeOccasion.guests.filter(g => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        g.name.toLowerCase().includes(q) || 
        g.phone.includes(q) || 
        g.address.toLowerCase().includes(q) ||
        (g.city && g.city.toLowerCase().includes(q));

      const matchCat = filterCategory === 'all' || g.category === filterCategory;
      const matchStat = filterStatus === 'all' || g.status === filterStatus;

      return matchSearch && matchCat && matchStat;
    });
  }, [activeOccasion, searchQuery, filterCategory, filterStatus]);

  const totalGuests = activeOccasion?.guests.length || 0;
  const totalAttendees = activeOccasion?.guests.reduce((acc, g) => acc + (Number(g.membersCount) || 1), 0) || 0;
  const confirmedCount = activeOccasion?.guests.filter(g => g.status === 'Confirmed').length || 0;
  const confirmedAttendees = activeOccasion?.guests
    .filter(g => g.status === 'Confirmed')
    .reduce((acc, g) => acc + (Number(g.membersCount) || 1), 0) || 0;

  const translateCategory = (cat?: string) => {
    switch (cat) {
      case 'Family/Relatives': return t('Family/Relatives', 'परिवार व रिश्तेदार');
      case 'Groom Side': return t('Groom Side', 'वर पक्ष');
      case 'Bride Side': return t('Bride Side', 'वधू पक्ष');
      case 'Friends': return t('Friends', 'मित्र व सहयोगी');
      case 'Samaj Dignitaries': return t('Samaj Dignitaries', 'समाज गणमान्य');
      case 'Other': return t('Other', 'अन्य');
      default: return cat || t('Family/Relatives', 'परिवार व रिश्तेदार');
    }
  };

  const translateStatus = (status?: string) => {
    switch (status) {
      case 'Confirmed': return t('Confirmed', 'पुष्ट (Confirmed)');
      case 'Card Sent': return t('Card Sent', 'निमंत्रण भेजा');
      case 'Declined': return t('Declined', 'अस्वीकृत');
      default: return t('Pending', 'लंबित (Pending)');
    }
  };

  const handleSaveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    setGuestFormError(null);

    if (!guestForm.name.trim()) {
      setGuestFormError(t('Guest name is required.', 'अतिथि का नाम आवश्यक है।'));
      return;
    }

    const phoneCheck = validatePhoneNumber(guestForm.phone, true);
    if (!phoneCheck.valid) {
      setGuestFormError(lang === 'hi' ? (phoneCheck.errorHi || '') : (phoneCheck.errorEn || ''));
      return;
    }

    const cleanedGuest = {
      ...guestForm,
      name: guestForm.name.trim(),
      phone: phoneCheck.cleaned,
      address: guestForm.address.trim(),
      city: guestForm.city.trim(),
      notes: guestForm.notes.trim()
    };

    if (editingGuest) {
      const updatedOccasions = occasions.map(occ => {
        if (occ.id !== activeOccasion.id) return occ;
        return {
          ...occ,
          guests: occ.guests.map(g => {
            if (g.id !== editingGuest.id) return g;
            return {
              ...g,
              ...cleanedGuest,
              updatedAt: new Date().toLocaleDateString()
            };
          })
        };
      });
      saveOccasions(updatedOccasions);
      setEditingGuest(null);
    } else {
      const newGuest: GuestItem = {
        id: `g-${Date.now()}`,
        ...cleanedGuest,
        updatedAt: new Date().toLocaleDateString()
      };

      const updatedOccasions = occasions.map(occ => {
        if (occ.id !== activeOccasion.id) return occ;
        return {
          ...occ,
          guests: [newGuest, ...occ.guests]
        };
      });
      saveOccasions(updatedOccasions);
    }

    setShowAddGuestModal(false);
    setGuestForm({
      name: '',
      phone: '',
      address: '',
      city: '',
      category: 'Family/Relatives',
      membersCount: 2,
      status: 'Pending',
      notes: ''
    });
  };

  const handleEditClick = (guest: GuestItem) => {
    setEditingGuest(guest);
    setGuestFormError(null);
    setGuestForm({
      name: guest.name,
      phone: sanitizePhoneInput(guest.phone),
      address: guest.address,
      city: guest.city || '',
      category: guest.category || 'Family/Relatives',
      membersCount: guest.membersCount || 2,
      status: guest.status || 'Pending',
      notes: guest.notes || ''
    });
    setShowAddGuestModal(true);
  };

  const handleDeleteGuest = (id: string, name: string) => {
    const confirmMsg = t(
      `Are you sure you want to remove "${name}" from this guest list?`,
      `क्या आप वाकई "${name}" को इस अतिथि सूची से हटाना चाहते हैं?`
    );
    if (!window.confirm(confirmMsg)) return;

    const updatedOccasions = occasions.map(occ => {
      if (occ.id !== activeOccasion.id) return occ;
      return {
        ...occ,
        guests: occ.guests.filter(g => g.id !== id)
      };
    });
    saveOccasions(updatedOccasions);
  };

  const handleCreateOccasion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOccasionTitle.trim()) return;

    const newOcc: GuestListOccasion = {
      id: `occ-${Date.now()}`,
      title: newOccasionTitle.trim(),
      date: newOccasionDate || new Date().toISOString().split('T')[0],
      venue: newOccasionVenue.trim() || 'Samaj Venue',
      guests: [],
      createdAt: new Date().toLocaleDateString()
    };

    const updated = [newOcc, ...occasions];
    saveOccasions(updated);
    setActiveOccasionId(newOcc.id);
    setShowNewOccasionModal(false);
    setNewOccasionTitle('');
    setNewOccasionDate('');
    setNewOccasionVenue('');
  };

  const handleShareListWhatsApp = () => {
    if (!activeOccasion) return;

    let text = `📋 *${activeOccasion.title}* 📋\n`;
    if (activeOccasion.date) text += `📅 ${t('Date:', 'दिनांक:')} ${activeOccasion.date}\n`;
    if (activeOccasion.venue) text += `📍 ${t('Venue:', 'स्थान:')} ${activeOccasion.venue}\n`;
    text += `👥 ${t('Total Guests:', 'कुल अतिथि:')} ${totalGuests} (${totalAttendees}) | ${t('Confirmed:', 'पुष्ट:')} ${confirmedCount}\n\n`;
    text += `*--- ${t('Guest List', 'अतिथि सूची')} ---*\n`;

    filteredGuests.forEach((g, idx) => {
      text += `${idx + 1}. *${g.name}* (${g.membersCount} ${t('Persons', 'सदस्य')})\n`;
      text += `   📞 ${g.phone} | 📍 ${g.address}\n`;
      text += `   ${t('Status:', 'स्थिति:')} ${g.status === 'Confirmed' ? '✅ Confirmed' : g.status === 'Card Sent' ? '✉️ Card Sent' : '⏳ Pending'}\n\n`;
    });

    text += `_Rathore Rishtey Guest Planner_\nhttps://svayaa.com/`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSendPersonalInviteWhatsApp = (guest: GuestItem) => {
    const text = lang === 'hi'
      ? `जय माताजी की!\n\nआदरणीय *${guest.name}* जी,\n\nसप्रेम नमस्कार! आपको एवं आपके पूरे परिवार को *${activeOccasion.title}* के शुभ अवसर पर सपरिवार पधारने का स्नेहभरा निमंत्रण है।\n\n📅 दिनांक: ${activeOccasion.date || 'शीघ्र घोषित'}\n📍 स्थान: ${activeOccasion.venue || 'कार्यक्रम स्थल'}\n\nआपकी उपस्थिति से हमारा समारोह गौरवान्वित होगा।\n\nभवदीय,\nराठौड़ परिवार\nसंपर्क: +91 9826012345`
      : `Jai Mataji Ki!\n\nDear *${guest.name}*,\n\nPlease accept our warm regards and cordial invitation. You and your family are cordially invited to celebrate the auspicious occasion of *${activeOccasion.title}* with us.\n\n📅 Date: ${activeOccasion.date || 'To be announced'}\n📍 Venue: ${activeOccasion.venue || 'Event Venue'}\n\nYour presence and blessings will make this celebration truly special.\n\nWarm regards,\nRathore Family\nContact: +91 9826012345`;

    const cleanPhone = guest.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#24050b] via-[#380812] to-[#24050b] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>{t('Family & Wedding Guest Directory', 'पारिवारिक व विवाह अतिथि डायरेक्टरी')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
            {t('Samaj Guest List & Invitation Planner', 'समाज अतिथि सूची एवं निमंत्रण प्लानर')}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl font-light leading-relaxed">
            {t(
              'Create your family wedding and occasion guest list once and save it forever. Store names, addresses, phone numbers, RSVP counts, and send one-click personalized WhatsApp invitations.',
              'अपने परिवार के विवाह व शुभ कार्यक्रमों की अतिथि सूची एक बार बनाकर हमेशा के लिए सुरक्षित रखें। नाम, पता, फ़ोन नंबर व सदस्य संख्या सहेजें और व्हाट्सऐप निमंत्रण भेजें।'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setEditingGuest(null);
              setGuestFormError(null);
              setGuestForm({
                name: '',
                phone: '',
                address: '',
                city: '',
                category: 'Family/Relatives',
                membersCount: 2,
                status: 'Pending',
                notes: ''
              });
              setShowAddGuestModal(true);
            }}
            className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102 transition-all"
          >
            <UserPlus className="w-4 h-4 text-stone-950" />
            <span>{t('+ Add New Guest', '+ नया अतिथि जोड़ें')}</span>
          </button>

          <button
            onClick={() => setShowNewOccasionModal(true)}
            className="bg-white/10 hover:bg-white/20 text-stone-100 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-white/20 cursor-pointer transition-colors"
          >
            <Calendar className="w-4 h-4 text-amber-300" />
            <span>{t('+ New Occasion', '+ नया अवसर / कार्यक्रम')}</span>
          </button>
        </div>
      </div>

      {/* OCCASION SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-2.5 rounded-2xl border border-stone-200/90 shadow-xs">
        <span className="text-xs font-bold text-stone-600 px-2 shrink-0">
          {t('Saved Occasions:', 'सहेजे गए कार्यक्रम:')}
        </span>
        {occasions.map((occ) => (
          <button
            key={occ.id}
            onClick={() => setActiveOccasionId(occ.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeOccasionId === occ.id
                ? 'bg-[#380812] text-amber-200 shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span>{occ.title.split('•')[0].trim()}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeOccasionId === occ.id ? 'bg-amber-300 text-[#4c0d1b]' : 'bg-stone-200 text-stone-700'}`}>
              {occ.guests.length}
            </span>
          </button>
        ))}
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            {t('Total Guest Entries', 'कुल अतिथि परिवार')}
          </span>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-1">{totalGuests}</p>
          <span className="text-[11px] text-stone-500 font-medium">{t('Families & Dignitaries', 'परिवार व गणमान्य')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            {t('Total Expected Pax', 'कुल अपेक्षित सदस्य')}
          </span>
          <p className="text-2xl font-bold font-serif text-amber-900 mt-1">{totalAttendees} {t('Persons', 'सदस्य')}</p>
          <span className="text-[11px] text-stone-500 font-medium">{t('Catering & Seating Count', 'भोजन व बैठक व्यवस्था')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            {t('Confirmed (RSVP)', 'पुष्ट उपस्थिति')}
          </span>
          <p className="text-2xl font-bold font-serif text-emerald-700 mt-1">{confirmedCount} ({confirmedAttendees})</p>
          <span className="text-[11px] text-emerald-700 font-medium">{t('Attendance Confirmed', 'आगमन सुनिश्चित')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            {t('Cards Sent / Pending', 'कार्ड भेजे / शेष')}
          </span>
          <p className="text-2xl font-bold font-serif text-stone-700 mt-1">
            {totalGuests - confirmedCount} {t('Remaining', 'शेष')}
          </p>
          <span className="text-[11px] text-stone-500 font-medium">{t('Follow-up needed', 'संपर्क बाकी')}</span>
        </div>
      </div>

      {/* SEARCH, FILTERS & ACTION BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search guest name, phone, city...', 'अतिथि का नाम, फ़ोन या शहर खोजें...')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-amber-600 text-xs bg-stone-50/50"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-medium text-stone-700"
            >
              <option value="all">{t('All Relations', 'सभी संबंध')}</option>
              <option value="Family/Relatives">{t('Family/Relatives', 'परिवार व रिश्तेदार')}</option>
              <option value="Groom Side">{t('Groom Side', 'वर पक्ष')}</option>
              <option value="Bride Side">{t('Bride Side', 'वधू पक्ष')}</option>
              <option value="Friends">{t('Friends', 'मित्र')}</option>
              <option value="Samaj Dignitaries">{t('Samaj Dignitaries', 'समाज गणमान्य')}</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-medium text-stone-700"
            >
              <option value="all">{t('All RSVP Status', 'सभी स्थितियाँ')}</option>
              <option value="Confirmed">{t('Confirmed ✅', 'पुष्ट ✅')}</option>
              <option value="Card Sent">{t('Card Sent ✉️', 'कार्ड भेजा ✉️')}</option>
              <option value="Pending">{t('Pending ⏳', 'लंबित ⏳')}</option>
              <option value="Declined">{t('Declined ❌', 'अस्वीकृत ❌')}</option>
            </select>

            <div className="h-5 w-px bg-stone-200 mx-1 hidden sm:block"></div>

            <button
              onClick={handleShareListWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('Share List on WhatsApp', 'व्हाट्सऐप पर सूची साझा करें')}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">{t('Print / PDF', 'प्रिंट / PDF')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* GUEST TABLE */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {filteredGuests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl mx-auto flex items-center justify-center border border-amber-200">
              <Users className="w-7 h-7 text-amber-700" />
            </div>
            <h4 className="font-serif font-bold text-base text-stone-800">
              {t('No Guests Found', 'कोई अतिथि नहीं मिला')}
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              {t(
                'No guests match your current filter or search. Click "+ Add New Guest" to add guests.',
                'आपकी खोज के अनुसार कोई अतिथि नहीं मिला। नया अतिथि जोड़ने के लिए "+ नया अतिथि जोड़ें" दबाएं।'
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-bold">#</th>
                  <th className="py-3.5 px-4 font-bold">{t('Guest Name & Relation', 'अतिथि का नाम व संबंध')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('Phone Number', 'मोबाइल नंबर')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('Address & City', 'पता व शहर')}</th>
                  <th className="py-3.5 px-4 font-bold text-center">{t('Attendees', 'सदस्य संख्या')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('RSVP Status', 'स्थिति')}</th>
                  <th className="py-3.5 px-4 font-bold text-right">{t('Actions', 'विकल्प')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {filteredGuests.map((guest, idx) => (
                  <tr key={guest.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-stone-400 font-semibold text-[11px]">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-stone-900 text-sm font-serif">
                          {guest.name}
                        </p>
                        <span className="inline-block text-[10px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.2 rounded-md border border-amber-200/60 mt-0.5">
                          {translateCategory(guest.category)}
                        </span>
                        {guest.notes && (
                          <p className="text-[10px] text-stone-500 italic mt-0.5 line-clamp-1">
                            {t('Note:', 'नोट:')} {guest.notes}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-700">
                      <a href={`tel:${guest.phone}`} className="hover:text-amber-800 hover:underline">
                        {guest.phone}
                      </a>
                    </td>

                    <td className="py-3.5 px-4 max-w-[220px]">
                      <p className="truncate text-stone-700">{guest.address}</p>
                      {guest.city && (
                        <span className="text-[10px] text-stone-400 block">{guest.city}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-stone-900">
                      <span className="inline-block px-2.5 py-0.5 bg-stone-100 rounded-lg text-xs">
                        {guest.membersCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        guest.status === 'Confirmed' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : guest.status === 'Card Sent'
                            ? 'bg-sky-100 text-sky-800'
                            : guest.status === 'Declined'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                      }`}>
                        {guest.status === 'Confirmed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {guest.status === 'Card Sent' && <Clock className="w-3 h-3 text-sky-600" />}
                        {translateStatus(guest.status)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSendPersonalInviteWhatsApp(guest)}
                          title={t('Send Personalized Invite on WhatsApp', 'व्हाट्सऐप पर व्यक्तिगत निमंत्रण भेजें')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 p-1.5 rounded-lg text-xs flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span className="hidden xl:inline">{t('WhatsApp Card', 'निमंत्रण कार्ड')}</span>
                        </button>

                        <button
                          onClick={() => handleEditClick(guest)}
                          title={t('Edit Guest Details', 'संपादित करें')}
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteGuest(guest.id, guest.name)}
                          title={t('Remove Guest', 'हटाएं')}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT GUEST */}
      {showAddGuestModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setShowAddGuestModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddGuestModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-stone-900 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-700" />
              <span>{editingGuest ? t('Edit Guest Information', 'अतिथि विवरण संपादित करें') : t('Add New Guest to List', 'सूची में नया अतिथि जोड़ें')}</span>
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {t('Saved to:', 'सहेजा जा रहा है:')} <strong>{activeOccasion.title.split('•')[0].trim()}</strong>
            </p>

            {guestFormError && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{guestFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGuest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t('Guest Full Name *', 'अतिथि का पूरा नाम *')}
                </label>
                <input 
                  type="text"
                  required
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  placeholder={t('e.g. Thakur Mahendra Singh Rathore', 'उदा. ठाकुर महेंद्र सिंह राठौड़')}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{t('Phone (10 Digits) *', 'मोबाइल (10 अंक) *')}</span>
                    <span className="text-[10px] font-mono text-stone-400">{guestForm.phone.length}/10</span>
                  </label>
                  <input 
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={guestForm.phone}
                    onChange={(e) => {
                      const cleaned = sanitizePhoneInput(e.target.value);
                      setGuestForm({ ...guestForm, phone: cleaned });
                      if (cleaned.length > 0) {
                        const check = validatePhoneNumber(cleaned, true);
                        setGuestFormError(check.valid ? null : (lang === 'hi' ? check.errorHi || null : check.errorEn || null));
                      } else {
                        setGuestFormError(null);
                      }
                    }}
                    placeholder={t('10-digit mobile', '10 अंकों का नंबर')}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900 font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('Relation / Side', 'संबंध / पक्ष')}
                  </label>
                  <select
                    value={guestForm.category}
                    onChange={(e) => setGuestForm({ ...guestForm, category: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 text-stone-900 font-medium"
                  >
                    <option value="Family/Relatives">{t('Family & Relatives', 'परिवार व रिश्तेदार')}</option>
                    <option value="Groom Side">{t('Groom Side', 'वर पक्ष')}</option>
                    <option value="Bride Side">{t('Bride Side', 'वधू पक्ष')}</option>
                    <option value="Friends">{t('Friends & Colleagues', 'मित्र व सहयोगी')}</option>
                    <option value="Samaj Dignitaries">{t('Samaj Dignitaries', 'समाज गणमान्य')}</option>
                    <option value="Other">{t('Other', 'अन्य')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t('Postal Address & Street *', 'पूरा पता *')}
                </label>
                <input 
                  type="text"
                  required
                  value={guestForm.address}
                  onChange={(e) => setGuestForm({ ...guestForm, address: e.target.value })}
                  placeholder={t('e.g. Bunglow No. 12, Rajendra Nagar', 'उदा. बंगला नं. 12, राजेंद्र नगर')}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('City / Native Place', 'शहर / गाँव')}
                  </label>
                  <input 
                    type="text"
                    value={guestForm.city}
                    onChange={(e) => setGuestForm({ ...guestForm, city: e.target.value })}
                    placeholder={t('e.g. Indore / Nanded / Jaipur', 'उदा. इंदौर / नांदेड़ / जयपुर')}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('Number of Attendees', 'सदस्य संख्या')}
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="50"
                    value={guestForm.membersCount}
                    onChange={(e) => setGuestForm({ ...guestForm, membersCount: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('Invitation Card Status', 'निमंत्रण कार्ड स्थिति')}
                  </label>
                  <select
                    value={guestForm.status}
                    onChange={(e) => setGuestForm({ ...guestForm, status: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 text-stone-900 font-medium"
                  >
                    <option value="Pending">{t('Pending ⏳', 'लंबित ⏳')}</option>
                    <option value="Card Sent">{t('Card Sent ✉️', 'कार्ड भेजा ✉️')}</option>
                    <option value="Confirmed">{t('Confirmed Attending ✅', 'पुष्ट ✅')}</option>
                    <option value="Declined">{t('Declined ❌', 'अस्वीकृत ❌')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    {t('Special Notes', 'विशेष टिप्पणी')}
                  </label>
                  <input 
                    type="text"
                    value={guestForm.notes}
                    onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
                    placeholder={t('e.g. Hotel pickup needed', 'उदा. ठहरने की व्यवस्था')}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddGuestModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold cursor-pointer hover:bg-stone-50"
                >
                  {t('Cancel', 'रद्द करें')}
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-102"
                >
                  {editingGuest ? t('Update Guest', 'अपडेट करें') : t('Save to Guest List', 'सूची में सहेजें')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW OCCASION */}
      {showNewOccasionModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setShowNewOccasionModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-300 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowNewOccasionModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-stone-900 mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-700" />
              <span>{t('Create New Occasion List', 'नया अवसर / सूची बनाएं')}</span>
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {t(
                'Save a separate guest list for wedding, engagement, haldi, or community banquet.',
                'विवाह, सगाई, हल्दी या पारिवारिक समारोह के लिए अलग अतिथि सूची सहेजें।'
              )}
            </p>

            <form onSubmit={handleCreateOccasion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t('Occasion Title *', 'अवसर / कार्यक्रम का नाम *')}
                </label>
                <input 
                  type="text"
                  required
                  value={newOccasionTitle}
                  onChange={(e) => setNewOccasionTitle(e.target.value)}
                  placeholder={t('e.g. Haldi & Sangeet Ceremony', 'उदा. हल्दी एवं संगीत समारोह')}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t('Date of Event', 'कार्यक्रम दिनांक')}
                </label>
                <input 
                  type="date"
                  value={newOccasionDate}
                  onChange={(e) => setNewOccasionDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t('Venue / Location', 'स्थान')}
                </label>
                <input 
                  type="text"
                  value={newOccasionVenue}
                  onChange={(e) => setNewOccasionVenue(e.target.value)}
                  placeholder={t('e.g. Royal Banquet, Indore', 'उदा. समाज भवन, इंदौर')}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-amber-600 focus:bg-white text-stone-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOccasionModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold cursor-pointer"
                >
                  {t('Cancel', 'रद्द करें')}
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  {t('Create List', 'सूची बनाएं')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

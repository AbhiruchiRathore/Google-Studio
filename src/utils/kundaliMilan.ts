/**
 * Vedic Ashtakoot (8 Kootas) Kundali Milan Engine
 * Total: 36 Gunas based on authentic Vedic Jyotish principles
 * 
 * 1. Varna (1 point): Work ego & spiritual temperament
 * 2. Vashya (2 points): Dominance and magnetic attraction
 * 3. Tara (3 points): Destiny, health, and birth star harmony
 * 4. Yoni (4 points): Biological and physical compatibility
 * 5. Graha Maitri (5 points): Psychological bonding & planetary friendship
 * 6. Gana (6 points): Temperament & behavioral nature
 * 7. Bhakoot (7 points): Emotional affinity, love, and longevity
 * 8. Nadi (8 points): Genetic health, physiological balance, and progeny
 */

export interface NakshatraInfo {
  index: number;
  name: string;
  hindiName: string;
  rashiIndex: number; // 0 to 11
  lord: string;
  yoni: string;
  gana: 'Deva' | 'Manushya' | 'Rakshasa';
  nadi: 'Aadi' | 'Madhya' | 'Antya';
}

export interface RashiInfo {
  index: number;
  name: string;
  hindiName: string;
  lord: 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
  varna: 'Brahmin' | 'Kshatriya' | 'Vaishya' | 'Shudra';
  vashya: 'Chatushpada' | 'Manava' | 'Jalachara' | 'Vanchara' | 'Keeta';
}

export const RASHIS: RashiInfo[] = [
  { index: 0, name: 'Aries', hindiName: 'मेष (Mesh)', lord: 'Mars', varna: 'Kshatriya', vashya: 'Chatushpada' },
  { index: 1, name: 'Taurus', hindiName: 'वृषभ (Vrishabh)', lord: 'Venus', varna: 'Vaishya', vashya: 'Chatushpada' },
  { index: 2, name: 'Gemini', hindiName: 'मिथुन (Mithun)', lord: 'Mercury', varna: 'Shudra', vashya: 'Manava' },
  { index: 3, name: 'Cancer', hindiName: 'कर्क (Kark)', lord: 'Moon', varna: 'Brahmin', vashya: 'Jalachara' },
  { index: 4, name: 'Leo', hindiName: 'सिंह (Singh)', lord: 'Sun', varna: 'Kshatriya', vashya: 'Vanchara' },
  { index: 5, name: 'Virgo', hindiName: 'कन्या (Kanya)', lord: 'Mercury', varna: 'Vaishya', vashya: 'Manava' },
  { index: 6, name: 'Libra', hindiName: 'तुला (Tula)', lord: 'Venus', varna: 'Shudra', vashya: 'Manava' },
  { index: 7, name: 'Scorpio', hindiName: 'वृश्चिक (Vrishchik)', lord: 'Mars', varna: 'Brahmin', vashya: 'Keeta' },
  { index: 8, name: 'Sagittarius', hindiName: 'धनु (Dhanu)', lord: 'Jupiter', varna: 'Kshatriya', vashya: 'Manava' },
  { index: 9, name: 'Capricorn', hindiName: 'मकर (Makar)', lord: 'Saturn', varna: 'Vaishya', vashya: 'Jalachara' },
  { index: 10, name: 'Aquarius', hindiName: 'कुंभ (Kumbh)', lord: 'Saturn', varna: 'Shudra', vashya: 'Manava' },
  { index: 11, name: 'Pisces', hindiName: 'मीन (Meen)', lord: 'Jupiter', varna: 'Brahmin', vashya: 'Jalachara' }
];

export const NAKSHATRAS: NakshatraInfo[] = [
  { index: 0, name: 'Ashwini', hindiName: 'अश्विनी', rashiIndex: 0, lord: 'Ketu', yoni: 'Horse', gana: 'Deva', nadi: 'Aadi' },
  { index: 1, name: 'Bharani', hindiName: 'भरणी', rashiIndex: 0, lord: 'Venus', yoni: 'Elephant', gana: 'Manushya', nadi: 'Madhya' },
  { index: 2, name: 'Krittika', hindiName: 'कृत्तिका', rashiIndex: 0, lord: 'Sun', yoni: 'Sheep', gana: 'Rakshasa', nadi: 'Antya' },
  { index: 3, name: 'Rohini', hindiName: 'रोहिणी', rashiIndex: 1, lord: 'Moon', yoni: 'Serpent', gana: 'Manushya', nadi: 'Antya' },
  { index: 4, name: 'Mrigashira', hindiName: 'मृगशिरा', rashiIndex: 1, lord: 'Mars', yoni: 'Serpent', gana: 'Deva', nadi: 'Madhya' },
  { index: 5, name: 'Ardra', hindiName: 'आर्द्रा', rashiIndex: 2, lord: 'Rahu', yoni: 'Dog', gana: 'Manushya', nadi: 'Aadi' },
  { index: 6, name: 'Punarvasu', hindiName: 'पुनर्वसु', rashiIndex: 2, lord: 'Jupiter', yoni: 'Cat', gana: 'Deva', nadi: 'Aadi' },
  { index: 7, name: 'Pushya', hindiName: 'पुष्य', rashiIndex: 3, lord: 'Saturn', yoni: 'Sheep', gana: 'Deva', nadi: 'Madhya' },
  { index: 8, name: 'Ashlesha', hindiName: 'आश्लेषा', rashiIndex: 3, lord: 'Mercury', yoni: 'Cat', gana: 'Rakshasa', nadi: 'Antya' },
  { index: 9, name: 'Magha', hindiName: 'मघा', rashiIndex: 4, lord: 'Ketu', yoni: 'Rat', gana: 'Rakshasa', nadi: 'Antya' },
  { index: 10, name: 'Purva Phalguni', hindiName: 'पूर्वा फाल्गुनी', rashiIndex: 4, lord: 'Venus', yoni: 'Rat', gana: 'Manushya', nadi: 'Madhya' },
  { index: 11, name: 'Uttara Phalguni', hindiName: 'उत्तरा फाल्गुनी', rashiIndex: 4, lord: 'Sun', yoni: 'Cow', gana: 'Manushya', nadi: 'Aadi' },
  { index: 12, name: 'Hasta', hindiName: 'हस्त', rashiIndex: 5, lord: 'Moon', yoni: 'Buffalo', gana: 'Deva', nadi: 'Aadi' },
  { index: 13, name: 'Chitra', hindiName: 'चित्रा', rashiIndex: 5, lord: 'Mars', yoni: 'Tiger', gana: 'Rakshasa', nadi: 'Madhya' },
  { index: 14, name: 'Swati', hindiName: 'स्वाति', rashiIndex: 6, lord: 'Rahu', yoni: 'Buffalo', gana: 'Deva', nadi: 'Antya' },
  { index: 15, name: 'Vishakha', hindiName: 'विशाखा', rashiIndex: 6, lord: 'Jupiter', yoni: 'Tiger', gana: 'Rakshasa', nadi: 'Antya' },
  { index: 16, name: 'Anuradha', hindiName: 'अनुराधा', rashiIndex: 7, lord: 'Saturn', yoni: 'Deer', gana: 'Deva', nadi: 'Madhya' },
  { index: 17, name: 'Jyeshtha', hindiName: 'ज्येष्ठा', rashiIndex: 7, lord: 'Mercury', yoni: 'Deer', gana: 'Rakshasa', nadi: 'Aadi' },
  { index: 18, name: 'Mula', hindiName: 'मूल', rashiIndex: 8, lord: 'Ketu', yoni: 'Dog', gana: 'Rakshasa', nadi: 'Aadi' },
  { index: 19, name: 'Purva Ashadha', hindiName: 'पूर्वाषाढ़ा', rashiIndex: 8, lord: 'Venus', yoni: 'Monkey', gana: 'Manushya', nadi: 'Madhya' },
  { index: 20, name: 'Uttara Ashadha', hindiName: 'उत्तराषाढ़ा', rashiIndex: 9, lord: 'Sun', yoni: 'Mongoose', gana: 'Manushya', nadi: 'Antya' },
  { index: 21, name: 'Shravana', hindiName: 'श्रवण', rashiIndex: 9, lord: 'Moon', yoni: 'Monkey', gana: 'Deva', nadi: 'Antya' },
  { index: 22, name: 'Dhanishta', hindiName: 'धनिष्ठा', rashiIndex: 10, lord: 'Mars', yoni: 'Lion', gana: 'Rakshasa', nadi: 'Madhya' },
  { index: 23, name: 'Shatabhisha', hindiName: 'शतभिषा', rashiIndex: 10, lord: 'Rahu', yoni: 'Horse', gana: 'Rakshasa', nadi: 'Aadi' },
  { index: 24, name: 'Purva Bhadrapada', hindiName: 'पूर्वा भाद्रपद', rashiIndex: 10, lord: 'Jupiter', yoni: 'Lion', gana: 'Manushya', nadi: 'Aadi' },
  { index: 25, name: 'Uttara Bhadrapada', hindiName: 'उत्तरा भाद्रपद', rashiIndex: 11, lord: 'Saturn', yoni: 'Cow', gana: 'Manushya', nadi: 'Madhya' },
  { index: 26, name: 'Revati', hindiName: 'रेवती', rashiIndex: 11, lord: 'Mercury', yoni: 'Elephant', gana: 'Deva', nadi: 'Antya' }
];

// Planetary Friendship matrix for Graha Maitri (5 points)
type Planet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';

const PLANETARY_FRIENDS: Record<Planet, { friends: Planet[]; neutral: Planet[]; enemies: Planet[] }> = {
  Sun: {
    friends: ['Moon', 'Mars', 'Jupiter'],
    neutral: ['Mercury'],
    enemies: ['Venus', 'Saturn']
  },
  Moon: {
    friends: ['Sun', 'Mercury'],
    neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
    enemies: []
  },
  Mars: {
    friends: ['Sun', 'Moon', 'Jupiter'],
    neutral: ['Venus', 'Saturn'],
    enemies: ['Mercury']
  },
  Mercury: {
    friends: ['Sun', 'Venus'],
    neutral: ['Mars', 'Jupiter', 'Saturn'],
    enemies: ['Moon']
  },
  Jupiter: {
    friends: ['Sun', 'Moon', 'Mars'],
    neutral: ['Saturn'],
    enemies: ['Mercury', 'Venus']
  },
  Venus: {
    friends: ['Mercury', 'Saturn'],
    neutral: ['Mars', 'Jupiter'],
    enemies: ['Sun', 'Moon']
  },
  Saturn: {
    friends: ['Mercury', 'Venus'],
    neutral: ['Jupiter'],
    enemies: ['Sun', 'Moon', 'Mars']
  }
};

// Yoni Enmity Pairs (0 points)
const YONI_ENEMIES: [string, string][] = [
  ['Horse', 'Buffalo'],
  ['Elephant', 'Lion'],
  ['Sheep', 'Monkey'],
  ['Serpent', 'Mongoose'],
  ['Dog', 'Deer'],
  ['Cat', 'Rat'],
  ['Cow', 'Tiger']
];

export interface KootaResult {
  name: string;
  hindiName: string;
  maxPoints: number;
  obtainedPoints: number;
  description: string;
  hindiDescription: string;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

export interface KundaliMilanReport {
  boyName: string;
  girlName: string;
  boyRashi: RashiInfo;
  girlRashi: RashiInfo;
  boyNakshatra: NakshatraInfo;
  girlNakshatra: NakshatraInfo;
  totalGunas: number;
  maxGunas: number;
  percentage: number;
  kootas: {
    varna: KootaResult;
    vashya: KootaResult;
    tara: KootaResult;
    yoni: KootaResult;
    grahaMaitri: KootaResult;
    gana: KootaResult;
    bhakoot: KootaResult;
    nadi: KootaResult;
  };
  verdict: {
    title: string;
    hindiTitle: string;
    grade: 'Sarvottam' | 'Uttam' | 'Madhyam' | 'Asammat';
    recommendation: string;
    hindiRecommendation: string;
    color: string;
  };
  doshaSummary: {
    nadiDosha: boolean;
    bhakootDosha: boolean;
    manglikCheck: {
      boyManglik: boolean;
      girlManglik: boolean;
      status: string;
      hindiStatus: string;
      isCompatible: boolean;
    };
  };
}

const PLANET_HINDI: Record<string, string> = {
  Sun: 'सूर्य',
  Moon: 'चंद्र',
  Mars: 'मंगल',
  Mercury: 'बुध',
  Jupiter: 'गुरु',
  Venus: 'शुक्र',
  Saturn: 'शनि',
  Rahu: 'राहु',
  Ketu: 'केतु'
};

const VARNA_HINDI: Record<string, string> = {
  Brahmin: 'ब्राह्मण',
  Kshatriya: 'क्षत्रिय',
  Vaishya: 'वैश्य',
  Shudra: 'शूद्र'
};

const GANA_HINDI: Record<string, string> = {
  Deva: 'देव',
  Manushya: 'मनुष्य',
  Rakshasa: 'राक्षस'
};

const NADI_HINDI: Record<string, string> = {
  Aadi: 'आदि',
  Madhya: 'मध्य',
  Antya: 'अन्त्य'
};

const YONI_HINDI: Record<string, string> = {
  Horse: 'अश्व',
  Elephant: 'गज',
  Sheep: 'मेष',
  Serpent: 'सर्प',
  Dog: 'श्वान',
  Cat: 'मार्जार',
  Rat: 'मूषक',
  Cow: 'गौ',
  Buffalo: 'महिष',
  Tiger: 'व्याघ्र',
  Deer: 'मृग',
  Monkey: 'वानर',
  Mongoose: 'नकुल',
  Lion: 'सिंह'
};

/**
 * 1. Varna Koota (1 point)
 */
export function calculateVarna(boyRashi: RashiInfo, girlRashi: RashiInfo): KootaResult {
  const varnaOrder: Record<string, number> = {
    Brahmin: 4,
    Kshatriya: 3,
    Vaishya: 2,
    Shudra: 1
  };

  const boyScore = varnaOrder[boyRashi.varna];
  const girlScore = varnaOrder[girlRashi.varna];

  let points = 0;
  let desc = '';
  let hindiDesc = '';

  if (boyScore >= girlScore) {
    points = 1;
    desc = `Excellent spiritual temperament (${boyRashi.varna} - ${girlRashi.varna}). Natural mutual respect.`;
    hindiDesc = `उत्तम आध्यात्मिक एवं कार्य स्वभाव (${VARNA_HINDI[boyRashi.varna]} - ${VARNA_HINDI[girlRashi.varna]})। परस्पर सम्मान स्वाभाविक रहेगा।`;
  } else {
    points = 0;
    desc = `Girl's varna (${girlRashi.varna}) is spiritually dominant over Boy's varna (${boyRashi.varna}).`;
    hindiDesc = `कन्या का वर्ण (${VARNA_HINDI[girlRashi.varna]}) वर के वर्ण (${VARNA_HINDI[boyRashi.varna]}) से उच्च है।`;
  }

  return {
    name: 'Varna',
    hindiName: 'वर्ण (कार्य एवं स्वभाव)',
    maxPoints: 1,
    obtainedPoints: points,
    description: desc,
    hindiDescription: hindiDesc,
    status: points === 1 ? 'excellent' : 'poor'
  };
}

/**
 * 2. Vashya Koota (2 points)
 */
export function calculateVashya(boyRashi: RashiInfo, girlRashi: RashiInfo): KootaResult {
  let points = 0;
  let desc = '';
  let hindiDesc = '';

  if (boyRashi.index === girlRashi.index || boyRashi.vashya === girlRashi.vashya) {
    points = 2;
    desc = 'Same Vashya class. Perfect mutual attraction and natural harmony.';
    hindiDesc = 'समान वश्य वर्ग। उत्कृष्ट पारस्परिक आकर्षण एवं स्वाभाविक सामंजस्य।';
  } else if (
    (boyRashi.vashya === 'Manava' && (girlRashi.vashya === 'Chatushpada' || girlRashi.vashya === 'Jalachara')) ||
    (boyRashi.vashya === 'Chatushpada' && girlRashi.vashya === 'Manava')
  ) {
    points = 1;
    desc = 'Moderate control balance. Mutual understanding can easily be built.';
    hindiDesc = 'मध्यम वश्य संतुलन। आपसी समझ सहजता से बनती है।';
  } else if (boyRashi.vashya === 'Vanchara' && girlRashi.vashya === 'Keeta') {
    points = 0.5;
    desc = 'Minor resistance in mutual dominance.';
    hindiDesc = 'परस्पर प्रभाव में आंशिक भिन्नता।';
  } else {
    points = 0;
    desc = 'Dissimilar Vashya attributes. Requires conscious adjustment.';
    hindiDesc = 'भिन्न वश्य गुण। आपसी सामंजस्य हेतु समझदारी आवश्यक है।';
  }

  return {
    name: 'Vashya',
    hindiName: 'वश्य (परस्पर प्रभाव एवं नियंत्रण)',
    maxPoints: 2,
    obtainedPoints: points,
    description: desc,
    hindiDescription: hindiDesc,
    status: points >= 1.5 ? 'excellent' : points >= 1 ? 'good' : 'poor'
  };
}

/**
 * 3. Tara Koota (3 points)
 */
export function calculateTara(boyNakshatra: NakshatraInfo, girlNakshatra: NakshatraInfo): KootaResult {
  const dist1 = ((boyNakshatra.index - girlNakshatra.index + 27) % 9) + 1;
  const dist2 = ((girlNakshatra.index - boyNakshatra.index + 27) % 9) + 1;

  const inauspiciousTaras = [3, 5, 7]; // Vipat (3), Pratyak (5), Vadha (7)
  const is1Good = !inauspiciousTaras.includes(dist1);
  const is2Good = !inauspiciousTaras.includes(dist2);

  let points = 0;
  if (is1Good && is2Good) points = 3;
  else if (is1Good || is2Good) points = 1.5;
  else points = 0;

  const desc = points === 3 
    ? 'Auspicious birth star alignment for health, wealth, and mutual destiny.' 
    : points === 1.5 
      ? 'Partially auspicious Tara balance.' 
      : 'Inauspicious Tara count. Astrological chanting recommended.';

  const hindiDesc = points === 3
    ? 'स्वास्थ्य, समृद्धि और भाग्य के लिए अत्यंत शुभ जन्म नक्षत्र योग।'
    : points === 1.5
      ? 'आंशिक रूप से शुभ तारा संतुलन।'
      : 'अशुभ तारा योग। वैदिक मंत्र जाप की सलाह दी जाती है।';

  return {
    name: 'Tara',
    hindiName: 'तारा (भाग्य एवं स्वास्थ्य)',
    maxPoints: 3,
    obtainedPoints: points,
    description: desc,
    hindiDescription: hindiDesc,
    status: points === 3 ? 'excellent' : points === 1.5 ? 'average' : 'poor'
  };
}

/**
 * 4. Yoni Koota (4 points)
 */
export function calculateYoni(boyNakshatra: NakshatraInfo, girlNakshatra: NakshatraInfo): KootaResult {
  const y1 = boyNakshatra.yoni;
  const y2 = girlNakshatra.yoni;
  const y1Hi = YONI_HINDI[y1] || y1;
  const y2Hi = YONI_HINDI[y2] || y2;

  let points = 0;
  let desc = '';
  let hindiDesc = '';

  const isEnemy = YONI_ENEMIES.some(([a, b]) => (a === y1 && b === y2) || (a === y2 && b === y1));

  if (y1 === y2) {
    points = 4;
    desc = `Same Yoni (${y1}). Supreme biological and physical intimacy harmony.`;
    hindiDesc = `समान योनि (${y1Hi})। सर्वोत्तम शारीरिक एवं जैविक अनुकूलता।`;
  } else if (isEnemy) {
    points = 0;
    desc = `Inimical Yonis (${y1} vs ${y2}). Severe instinctual clash.`;
    hindiDesc = `शत्रु योनि (${y1Hi} बनाम ${y2Hi})। प्रकृति एवं स्वभाव में तीव्र भिन्नता।`;
  } else {
    points = 2.5;
    desc = `Compatible Yonis (${y1} and ${y2}). Wholesome biological balance.`;
    hindiDesc = `अनुकूल योनियाँ (${y1Hi} एवं ${y2Hi})। संतुलित एवं सुखद दांपत्य तालमेल।`;
  }

  return {
    name: 'Yoni',
    hindiName: 'योनि (शारीरिक एवं जैविक अनुकूलता)',
    maxPoints: 4,
    obtainedPoints: points,
    description: desc,
    hindiDescription: hindiDesc,
    status: points >= 3 ? 'excellent' : points >= 2 ? 'good' : 'poor'
  };
}

/**
 * 5. Graha Maitri (5 points)
 */
export function calculateGrahaMaitri(boyRashi: RashiInfo, girlRashi: RashiInfo): KootaResult {
  const l1 = boyRashi.lord;
  const l2 = girlRashi.lord;
  const l1Hi = PLANET_HINDI[l1] || l1;
  const l2Hi = PLANET_HINDI[l2] || l2;

  let points = 0;
  let desc = '';
  let hindiDesc = '';

  if (l1 === l2) {
    points = 5;
    desc = `Same planetary lord (${l1}). Deep psychological affinity and mutual affection.`;
    hindiDesc = `समान राशि स्वामी (${l1Hi})। गहरा मानसिक जुड़ाव और पारस्परिक स्नेह।`;
  } else {
    const l1Friends = PLANETARY_FRIENDS[l1].friends;
    const l1Enemies = PLANETARY_FRIENDS[l1].enemies;
    const l2Friends = PLANETARY_FRIENDS[l2].friends;
    const l2Enemies = PLANETARY_FRIENDS[l2].enemies;

    const isL1toL2Friend = l1Friends.includes(l2);
    const isL1toL2Enemy = l1Enemies.includes(l2);
    const isL2toL1Friend = l2Friends.includes(l1);
    const isL2toL1Enemy = l2Enemies.includes(l1);

    if (isL1toL2Friend && isL2toL1Friend) {
      points = 5;
      desc = `Mutual best friends (${l1} and ${l2}). Wonderful mental synchronicity.`;
      hindiDesc = `परस्पर मित्र ग्रह (${l1Hi} एवं ${l2Hi})। अद्भुत मानसिक तालमेल और विचार सामंजस्य।`;
    } else if ((isL1toL2Friend && !isL2toL1Enemy) || (isL2toL1Friend && !isL1toL2Enemy)) {
      points = 4;
      desc = `Friendly planetary relation between Moon sign lords (${l1} and ${l2}).`;
      hindiDesc = `राशि स्वामियों (${l1Hi} एवं ${l2Hi}) के बीच सौहार्दपूर्ण मैत्री संबंध।`;
    } else if (!isL1toL2Enemy && !isL2toL1Enemy) {
      points = 3;
      desc = `Neutral planetary lords (${l1} and ${l2}). Balanced practical relationship.`;
      hindiDesc = `सम राशि स्वामी (${l1Hi} एवं ${l2Hi})। व्यावहारिक और संतुलित संबंध।`;
    } else if (isL1toL2Enemy && isL2toL1Enemy) {
      points = 0;
      desc = `Mutual enemy planetary lords (${l1} and ${l2}). Disagreements on core perspectives.`;
      hindiDesc = `परस्पर शत्रु राशि स्वामी (${l1Hi} एवं ${l2Hi})। वैचारिक मतभेद की संभावना।`;
    } else {
      points = 1;
      desc = `Mixed relationship between ${l1} and ${l2}. Requires open communication.`;
      hindiDesc = `${l1Hi} और ${l2Hi} के बीच मिश्रित संबंध। खुले संवाद की आवश्यकता।`;
    }
  }

  return {
    name: 'Graha Maitri',
    hindiName: 'ग्रह मैत्री (मानसिक सामंजस्य एवं मित्रता)',
    maxPoints: 5,
    obtainedPoints: points,
    description: desc,
    hindiDescription: hindiDesc,
    status: points >= 4 ? 'excellent' : points >= 3 ? 'good' : 'poor'
  };
}

/**
 * 6. Gana Koota (6 points)
 */
export function calculateGana(boyNakshatra: NakshatraInfo, girlNakshatra: NakshatraInfo): KootaResult {
  const g1 = boyNakshatra.gana;
  const g2 = girlNakshatra.gana;
  const g1Hi = GANA_HINDI[g1] || g1;
  const g2Hi = GANA_HINDI[g2] || g2;

  let points = 0;
  let desc = '';
  let hindiDesc = '';

  if (g1 === g2) {
    points = 6;
    desc = `Same Gana (${g1}). Similar temperaments, lifestyle values, and emotional reflexes.`;
    hindiDesc = `समान गण (${g1Hi})। समान स्वभाव, जीवनशैली और भावनात्मक समझ।`;
  } else if ((g1 === 'Deva' && g2 === 'Manushya') || (g1 === 'Manushya' && g2 === 'Deva')) {
    points = 5;
    desc = 'Deva & Manushya combination. High respect and harmonious coexistence.';
    hindiDesc = 'देव एवं मनुष्य गण का शुभ संयोग। उच्च सम्मान और सुखद सह-जीवन।';
  } else if (g1 === 'Deva' && g2 === 'Rakshasa') {
    points = 1;
    desc = 'Boy is Deva, Girl is Rakshasa. Different life outlooks and assertiveness.';
    hindiDesc = 'वर देव गण तथा कन्या राक्षस गण। जीवन दृष्टिकोण में भिन्नता।';
  } else {
    points = 0;
    desc = `Conflicting Ganas (${g1} and ${g2}). Gana dosha indicated.`;
    hindiDesc = `विपरीत गण (${g1Hi} एवं ${g2Hi})। गण दोष का संकेत।`;
  }

  return {
    name: 'Gana',
    hindiName: 'गण (व्यवहार एवं स्वभाव)',
    maxPoints: 6,
    obtainedPoints: points,
    description: desc,
    hindiDescription: hindiDesc,
    status: points >= 5 ? 'excellent' : points >= 3 ? 'average' : 'poor'
  };
}

/**
 * 7. Bhakoot Koota (7 points)
 */
export function calculateBhakoot(boyRashi: RashiInfo, girlRashi: RashiInfo): KootaResult {
  const diff = ((girlRashi.index - boyRashi.index + 12) % 12) + 1;
  const reverseDiff = ((boyRashi.index - girlRashi.index + 12) % 12) + 1;

  let points = 0;
  let desc = '';
  let hindiDesc = '';

  const isDvidvadash = (diff === 2 && reverseDiff === 12) || (diff === 12 && reverseDiff === 2);
  const isShadashtak = (diff === 6 && reverseDiff === 8) || (diff === 8 && reverseDiff === 6);
  const isNavapancham = (diff === 5 && reverseDiff === 9) || (diff === 9 && reverseDiff === 5);

  const l1 = boyRashi.lord;
  const l2 = girlRashi.lord;
  const l1Hi = PLANET_HINDI[l1] || l1;
  const l2Hi = PLANET_HINDI[l2] || l2;
  const isLordFriends = l1 === l2 || PLANETARY_FRIENDS[l1].friends.includes(l2);

  if (!isDvidvadash && !isShadashtak && !isNavapancham) {
    points = 7;
    desc = `Auspicious Bhakoot relation (${diff}/${reverseDiff}). Strong emotional bonding, health, and family prosperity.`;
    hindiDesc = `अत्यंत शुभ भकूट योग (${diff}/${reverseDiff})। प्रगाढ़ प्रेम, उत्तम स्वास्थ्य और पारिवारिक समृद्धि।`;
  } else if (isLordFriends) {
    points = 7;
    desc = `Bhakoot Dosha cancelled because Moon sign lords (${l1} and ${l2}) are friends or identical! Full 7 points awarded.`;
    hindiDesc = `राशि स्वामियों (${l1Hi} एवं ${l2Hi}) में मित्रता या समानता के कारण भकूट दोष निरस्त! पूरे 7 अंक प्राप्त।`;
  } else {
    points = 0;
    const doshaName = isDvidvadash ? 'Dwi-Dwadash (2/12)' : isShadashtak ? 'Shad-Ashtak (6/8)' : 'Nava-Pancham (5/9)';
    const doshaNameHi = isDvidvadash ? 'द्वि-द्वादश (2/12)' : isShadashtak ? 'षडाष्टक (6/8)' : 'नव-पंचम (5/9)';
    desc = `${doshaName} position without lord cancellation. Astrological remedies suggested.`;
    hindiDesc = `${doshaNameHi} योग (स्वामी मैत्री के बिना)। ज्योतिषीय शांति उपाय अनुशंसित।`;
  }

  return {
    name: 'Bhakoot',
    hindiName: 'भकूट (प्रेम, दीर्घायु एवं संतान)',
    maxPoints: 7,
    obtainedPoints: points,
    description: desc,
    hindiDescription: hindiDesc,
    status: points === 7 ? 'excellent' : 'poor'
  };
}

/**
 * 8. Nadi Koota (8 points)
 */
export function calculateNadi(boyNakshatra: NakshatraInfo, girlNakshatra: NakshatraInfo): KootaResult {
  const n1 = boyNakshatra.nadi;
  const n2 = girlNakshatra.nadi;
  const n1Hi = NADI_HINDI[n1] || n1;
  const n2Hi = NADI_HINDI[n2] || n2;

  let points = 0;
  let desc = '';
  let hindiDesc = '';

  if (n1 !== n2) {
    points = 8;
    desc = `Different Nadis (${n1} & ${n2}). Excellent genetic health, progeny well-being, and physiological balance.`;
    hindiDesc = `भिन्न नाड़ियाँ (${n1Hi} एवं ${n2Hi})। उत्तम स्वास्थ्य, संतान सुख और अनुवांशिक संतुलन।`;
  } else {
    if (boyNakshatra.index !== girlNakshatra.index && boyNakshatra.rashiIndex !== girlNakshatra.rashiIndex) {
      points = 8;
      desc = `Same Nadi (${n1}) but Moon signs are different. Nadi Dosha cancelled by Vedic exemption.`;
      hindiDesc = `समान नाड़ी (${n1Hi}) किंतु चंद्र राशियाँ भिन्न होने से वैदिक नियमानुसार नाड़ी दोष परिहार हो गया है।`;
    } else {
      points = 0;
      desc = `Same Nadi (${n1}). Traditional Nadi Dosha. Maha-Mrityunjaya Japa or gold donation suggested.`;
      hindiDesc = `समान नाड़ी (${n1Hi})। पारंपरिक नाड़ी दोष। महामृत्युंजय जाप या स्वर्ण दान अनुशंसित।`;
    }
  }

  return {
    name: 'Nadi',
    hindiName: 'नाड़ी (स्वास्थ्य, अनुवांशिकता एवं वंश)',
    maxPoints: 8,
    obtainedPoints: points,
    description: desc,
    hindiDescription: hindiDesc,
    status: points === 8 ? 'excellent' : 'poor'
  };
}

/**
 * Comprehensive Match Calculation
 */
export function performKundaliMilan(
  boyName: string,
  girlName: string,
  boyRashiIndex: number,
  girlRashiIndex: number,
  boyNakshatraIndex: number,
  girlNakshatraIndex: number,
  boyManglik: boolean = false,
  girlManglik: boolean = false
): KundaliMilanReport {
  const boyRashi = RASHIS[boyRashiIndex % 12];
  const girlRashi = RASHIS[girlRashiIndex % 12];
  const boyNakshatra = NAKSHATRAS[boyNakshatraIndex % 27];
  const girlNakshatra = NAKSHATRAS[girlNakshatraIndex % 27];

  const varna = calculateVarna(boyRashi, girlRashi);
  const vashya = calculateVashya(boyRashi, girlRashi);
  const tara = calculateTara(boyNakshatra, girlNakshatra);
  const yoni = calculateYoni(boyNakshatra, girlNakshatra);
  const grahaMaitri = calculateGrahaMaitri(boyRashi, girlRashi);
  const gana = calculateGana(boyNakshatra, girlNakshatra);
  const bhakoot = calculateBhakoot(boyRashi, girlRashi);
  const nadi = calculateNadi(boyNakshatra, girlNakshatra);

  const totalGunas = 
    varna.obtainedPoints +
    vashya.obtainedPoints +
    tara.obtainedPoints +
    yoni.obtainedPoints +
    grahaMaitri.obtainedPoints +
    gana.obtainedPoints +
    bhakoot.obtainedPoints +
    nadi.obtainedPoints;

  const percentage = Math.round((totalGunas / 36) * 100);

  // Manglik compatibility check
  let manglikStatus = '';
  let manglikHindiStatus = '';
  let manglikCompatible = false;

  if (boyManglik && girlManglik) {
    manglikStatus = 'Both are Manglik. Kuja Dosha is completely cancelled (दोष निवारण). Highly auspicious!';
    manglikHindiStatus = 'दोनों मांगलिक हैं। मंगल दोष का स्वतः पूर्ण निवारण हो गया है। विवाह अत्यंत शुभ है!';
    manglikCompatible = true;
  } else if (!boyManglik && !girlManglik) {
    manglikStatus = 'Neither partner is Manglik. Perfect harmony without Mars affliction.';
    manglikHindiStatus = 'दोनों में से कोई मांगलिक नहीं है। मंगल दोष से पूर्णतः मुक्त उत्तम सामंजस्य।';
    manglikCompatible = true;
  } else if (boyManglik && !girlManglik) {
    manglikStatus = 'Boy is Manglik while Girl is Non-Manglik. Astrological remedies (Kumbh Vivah) or further consultation advised.';
    manglikHindiStatus = 'वर मांगलिक है जबकि वधू अमांगलिक है। ज्योतिषीय परामर्श एवं कुंभ विवाह आदि उपाय की सलाह दी जाती है।';
    manglikCompatible = false;
  } else {
    manglikStatus = 'Girl is Manglik while Boy is Non-Manglik. Traditional remedies or horoscope chart analysis recommended.';
    manglikHindiStatus = 'वधू मांगलिक है जबकि वर अमांगलिक है। पारंपरिक शांति उपाय एवं विस्तृत कुंडली विश्लेषण की सलाह दी जाती है।';
    manglikCompatible = false;
  }

  // Verdict calculation
  let verdict: KundaliMilanReport['verdict'];

  if (totalGunas >= 28) {
    verdict = {
      title: 'Excellent / Divine Match (सर्वोत्कृष्ट संबंध)',
      hindiTitle: 'अत्यधिक शुभ मिलन - वैवाहिक जीवन अत्यंत सुखमय रहेगा',
      grade: 'Sarvottam',
      recommendation: 'Outstanding Gun Milan score (28+ Gunas). High psychological, physical, and familial harmony recommended for marriage.',
      hindiRecommendation: 'सर्वोत्कृष्ट गुण मिलान (28+ गुण)। मानसिक, शारीरिक एवं पारिवारिक सामंजस्य अत्युत्तम है — विवाह हेतु श्रेष्ठ।',
      color: 'emerald'
    };
  } else if (totalGunas >= 21) {
    verdict = {
      title: 'Very Good Match (उत्तम संबंध)',
      hindiTitle: 'विवाह हेतु उत्तम मिलन - सुख एवं समृद्धिदायक',
      grade: 'Uttam',
      recommendation: 'Healthy Gun Milan score (21 to 27.5 Gunas). Compatibility is well above traditional threshold (18). Marriage is auspicious.',
      hindiRecommendation: 'उत्तम गुण मिलान (21 से 27.5 गुण)। पारंपरिक न्यूनतम सीमा (18 गुण) से काफी बेहतर — विवाह शुभ एवं सुखद रहेगा।',
      color: 'teal'
    };
  } else if (totalGunas >= 18) {
    verdict = {
      title: 'Average / Acceptable Match (मध्यम संबंध)',
      hindiTitle: 'विवाह योग्य मिलन - सामान्य सामंजस्य',
      grade: 'Madhyam',
      recommendation: 'Meets the minimum Vedic passing threshold (18 Gunas). Specific remedies can be performed for weaker kootas.',
      hindiRecommendation: 'न्यूनतम वैदिक सीमा (18 गुण) पूर्ण होती है। कमज़ोर कूटों हेतु सामान्य ज्योतिषीय उपाय किए जा सकते हैं।',
      color: 'amber'
    };
  } else {
    verdict = {
      title: 'Below Passing Threshold (विचारणीय संबंध)',
      hindiTitle: 'अल्प गुण मिलन - ज्योतिषी परामर्श आवश्यक',
      grade: 'Asammat',
      recommendation: 'Score is under 18 Gunas. Detailed family chart analysis and Vedic shanti rituals are recommended prior to finalizing.',
      hindiRecommendation: 'कुल स्कोर 18 गुणों से कम है। विवाह निर्णय से पूर्व विस्तृत जन्मपत्रिका विश्लेषण एवं वैदिक शांति अनुष्ठान आवश्यक हैं।',
      color: 'rose'
    };
  }

  return {
    boyName,
    girlName,
    boyRashi,
    girlRashi,
    boyNakshatra,
    girlNakshatra,
    totalGunas,
    maxGunas: 36,
    percentage,
    kootas: {
      varna,
      vashya,
      tara,
      yoni,
      grahaMaitri,
      gana,
      bhakoot,
      nadi
    },
    verdict,
    doshaSummary: {
      nadiDosha: nadi.obtainedPoints === 0,
      bhakootDosha: bhakoot.obtainedPoints === 0,
      manglikCheck: {
        boyManglik,
        girlManglik,
        status: manglikStatus,
        hindiStatus: manglikHindiStatus,
        isCompatible: manglikCompatible
      }
    }
  };
}

/**
 * Helper to infer Rashi index from candidate Rashi text
 */
export function inferRashiIndex(rashiText?: string): number {
  if (!rashiText) return 0;
  const lower = rashiText.toLowerCase();
  if (lower.includes('mesh') || lower.includes('aries')) return 0;
  if (lower.includes('vrishabh') || lower.includes('taurus')) return 1;
  if (lower.includes('mithun') || lower.includes('gemini')) return 2;
  if (lower.includes('kark') || lower.includes('cancer')) return 3;
  if (lower.includes('singh') || lower.includes('leo')) return 4;
  if (lower.includes('kanya') || lower.includes('virgo')) return 5;
  if (lower.includes('tula') || lower.includes('libra')) return 6;
  if (lower.includes('vrishchik') || lower.includes('scorpio')) return 7;
  if (lower.includes('dhanu') || lower.includes('sagittarius')) return 8;
  if (lower.includes('makar') || lower.includes('capricorn')) return 9;
  if (lower.includes('kumbh') || lower.includes('aquarius')) return 10;
  if (lower.includes('meen') || lower.includes('pisces')) return 11;
  return 0;
}

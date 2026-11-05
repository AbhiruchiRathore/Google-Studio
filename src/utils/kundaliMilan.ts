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
    color: string;
  };
  doshaSummary: {
    nadiDosha: boolean;
    bhakootDosha: boolean;
    manglikCheck: {
      boyManglik: boolean;
      girlManglik: boolean;
      status: string;
      isCompatible: boolean;
    };
  };
}

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

  if (boyScore >= girlScore) {
    points = 1;
    desc = `Excellent spiritual temperament (${boyRashi.varna} - ${girlRashi.varna}). Natural mutual respect.`;
  } else {
    points = 0;
    desc = `Girl's varna (${girlRashi.varna}) is spiritually dominant over Boy's varna (${boyRashi.varna}).`;
  }

  return {
    name: 'Varna',
    hindiName: 'वर्ण (कार्य एवं स्वभाव)',
    maxPoints: 1,
    obtainedPoints: points,
    description: desc,
    status: points === 1 ? 'excellent' : 'poor'
  };
}

/**
 * 2. Vashya Koota (2 points)
 */
export function calculateVashya(boyRashi: RashiInfo, girlRashi: RashiInfo): KootaResult {
  let points = 0;
  let desc = '';

  if (boyRashi.index === girlRashi.index || boyRashi.vashya === girlRashi.vashya) {
    points = 2;
    desc = 'Same Vashya class. Perfect mutual attraction and natural harmony.';
  } else if (
    (boyRashi.vashya === 'Manava' && (girlRashi.vashya === 'Chatushpada' || girlRashi.vashya === 'Jalachara')) ||
    (boyRashi.vashya === 'Chatushpada' && girlRashi.vashya === 'Manava')
  ) {
    points = 1;
    desc = 'Moderate control balance. Mutual understanding can easily be built.';
  } else if (boyRashi.vashya === 'Vanchara' && girlRashi.vashya === 'Keeta') {
    points = 0.5;
    desc = 'Minor resistance in mutual dominance.';
  } else {
    points = 0;
    desc = 'Dissimilar Vashya attributes. Requires conscious adjustment.';
  }

  return {
    name: 'Vashya',
    hindiName: 'वश्य (परस्पर प्रभाव एवं नियंत्रण)',
    maxPoints: 2,
    obtainedPoints: points,
    description: desc,
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

  return {
    name: 'Tara',
    hindiName: 'तारा (भाग्य एवं स्वास्थ्य)',
    maxPoints: 3,
    obtainedPoints: points,
    description: desc,
    status: points === 3 ? 'excellent' : points === 1.5 ? 'average' : 'poor'
  };
}

/**
 * 4. Yoni Koota (4 points)
 */
export function calculateYoni(boyNakshatra: NakshatraInfo, girlNakshatra: NakshatraInfo): KootaResult {
  const y1 = boyNakshatra.yoni;
  const y2 = girlNakshatra.yoni;

  let points = 0;
  let desc = '';

  const isEnemy = YONI_ENEMIES.some(([a, b]) => (a === y1 && b === y2) || (a === y2 && b === y1));

  if (y1 === y2) {
    points = 4;
    desc = `Same Yoni (${y1}). Supreme biological and physical intimacy harmony.`;
  } else if (isEnemy) {
    points = 0;
    desc = `Inimical Yonis (${y1} vs ${y2}). Severe instinctual clash.`;
  } else {
    // Friendly vs Neutral
    points = 2.5;
    desc = `Compatible Yonis (${y1} and ${y2}). Wholesome biological balance.`;
  }

  return {
    name: 'Yoni',
    hindiName: 'योनि (शारीरिक एवं जैविक अनुकूलता)',
    maxPoints: 4,
    obtainedPoints: points,
    description: desc,
    status: points >= 3 ? 'excellent' : points >= 2 ? 'good' : 'poor'
  };
}

/**
 * 5. Graha Maitri (5 points)
 */
export function calculateGrahaMaitri(boyRashi: RashiInfo, girlRashi: RashiInfo): KootaResult {
  const l1 = boyRashi.lord;
  const l2 = girlRashi.lord;

  let points = 0;
  let desc = '';

  if (l1 === l2) {
    points = 5;
    desc = `Same planetary lord (${l1}). Deep psychological affinity and mutual affection.`;
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
    } else if ((isL1toL2Friend && !isL2toL1Enemy) || (isL2toL1Friend && !isL1toL2Enemy)) {
      points = 4;
      desc = `Friendly planetary relation between Moon sign lords (${l1} and ${l2}).`;
    } else if (!isL1toL2Enemy && !isL2toL1Enemy) {
      points = 3;
      desc = `Neutral planetary lords (${l1} and ${l2}). Balanced practical relationship.`;
    } else if (isL1toL2Enemy && isL2toL1Enemy) {
      points = 0;
      desc = `Mutual enemy planetary lords (${l1} and ${l2}). Disagreements on core perspectives.`;
    } else {
      points = 1;
      desc = `Mixed relationship between ${l1} and ${l2}. Requires open communication.`;
    }
  }

  return {
    name: 'Graha Maitri',
    hindiName: 'ग्रह मैत्री (मानसिक सामंजस्य एवं मित्रता)',
    maxPoints: 5,
    obtainedPoints: points,
    description: desc,
    status: points >= 4 ? 'excellent' : points >= 3 ? 'good' : 'poor'
  };
}

/**
 * 6. Gana Koota (6 points)
 */
export function calculateGana(boyNakshatra: NakshatraInfo, girlNakshatra: NakshatraInfo): KootaResult {
  const g1 = boyNakshatra.gana;
  const g2 = girlNakshatra.gana;

  let points = 0;
  let desc = '';

  if (g1 === g2) {
    points = 6;
    desc = `Same Gana (${g1}). Similar temperaments, lifestyle values, and emotional reflexes.`;
  } else if ((g1 === 'Deva' && g2 === 'Manushya') || (g1 === 'Manushya' && g2 === 'Deva')) {
    points = 5;
    desc = 'Deva & Manushya combination. High respect and harmonious coexistence.';
  } else if (g1 === 'Deva' && g2 === 'Rakshasa') {
    points = 1;
    desc = 'Boy is Deva, Girl is Rakshasa. Different life outlooks and assertiveness.';
  } else {
    points = 0;
    desc = `Conflicting Ganas (${g1} and ${g2}). Gana dosha indicated.`;
  }

  return {
    name: 'Gana',
    hindiName: 'गण (व्यवहार एवं स्वभाव)',
    maxPoints: 6,
    obtainedPoints: points,
    description: desc,
    status: points >= 5 ? 'excellent' : points >= 3 ? 'average' : 'poor'
  };
}

/**
 * 7. Bhakoot Koota (7 points)
 */
export function calculateBhakoot(boyRashi: RashiInfo, girlRashi: RashiInfo): KootaResult {
  // Distance from Boy to Girl (1-indexed)
  const diff = ((girlRashi.index - boyRashi.index + 12) % 12) + 1;
  const reverseDiff = ((boyRashi.index - girlRashi.index + 12) % 12) + 1;

  let points = 0;
  let desc = '';

  // Inauspicious combinations:
  // 2/12 (Dvidvadash), 6/8 (Shadashtak), 9/5 (Navapancham)
  const isDvidvadash = (diff === 2 && reverseDiff === 12) || (diff === 12 && reverseDiff === 2);
  const isShadashtak = (diff === 6 && reverseDiff === 8) || (diff === 8 && reverseDiff === 6);
  const isNavapancham = (diff === 5 && reverseDiff === 9) || (diff === 9 && reverseDiff === 5);

  // Cancellation rule: If sign lords are same or mutual friends, Bhakoot dosha is nullified!
  const l1 = boyRashi.lord;
  const l2 = girlRashi.lord;
  const isLordFriends = l1 === l2 || PLANETARY_FRIENDS[l1].friends.includes(l2);

  if (!isDvidvadash && !isShadashtak && !isNavapancham) {
    points = 7;
    desc = `Auspicious Bhakoot relation (${diff}/${reverseDiff}). Strong emotional bonding, health, and family prosperity.`;
  } else if (isLordFriends) {
    points = 7;
    desc = `Bhakoot Dosha cancelled because Moon sign lords (${l1} and ${l2}) are friends or identical! Full 7 points awarded.`;
  } else {
    points = 0;
    const doshaName = isDvidvadash ? 'Dwi-Dwadash (2/12)' : isShadashtak ? 'Shad-Ashtak (6/8)' : 'Nava-Pancham (5/9)';
    desc = `${doshaName} position without lord cancellation. Astrological remedies suggested.`;
  }

  return {
    name: 'Bhakoot',
    hindiName: 'भकूट (प्रेम, दीर्घायु एवं संतान)',
    maxPoints: 7,
    obtainedPoints: points,
    description: desc,
    status: points === 7 ? 'excellent' : 'poor'
  };
}

/**
 * 8. Nadi Koota (8 points)
 */
export function calculateNadi(boyNakshatra: NakshatraInfo, girlNakshatra: NakshatraInfo): KootaResult {
  const n1 = boyNakshatra.nadi;
  const n2 = girlNakshatra.nadi;

  let points = 0;
  let desc = '';

  if (n1 !== n2) {
    points = 8;
    desc = `Different Nadis (${n1} & ${n2}). Excellent genetic health, progeny well-being, and physiological balance.`;
  } else {
    // Same Nadi: Check standard Vedic cancellation rules
    // Cancellation 1: Same Nakshatra but different charanas/padas or different Rashis
    if (boyNakshatra.index !== girlNakshatra.index && boyNakshatra.rashiIndex !== girlNakshatra.rashiIndex) {
      points = 8;
      desc = `Same Nadi (${n1}) but Moon signs are different. Nadi Dosha cancelled by Vedic exemption.`;
    } else {
      points = 0;
      desc = `Same Nadi (${n1}). Traditional Nadi Dosha. Maha-Mrityunjaya Japa or gold donation suggested.`;
    }
  }

  return {
    name: 'Nadi',
    hindiName: 'नाड़ी (स्वास्थ्य, अनुवांशिकता एवं वंश)',
    maxPoints: 8,
    obtainedPoints: points,
    description: desc,
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
  let manglikCompatible = false;

  if (boyManglik && girlManglik) {
    manglikStatus = 'Both are Manglik. Kuja Dosha is completely cancelled (दोष निवारण). Highly auspicious!';
    manglikCompatible = true;
  } else if (!boyManglik && !girlManglik) {
    manglikStatus = 'Neither partner is Manglik. Perfect harmony without Mars affliction.';
    manglikCompatible = true;
  } else if (boyManglik && !girlManglik) {
    manglikStatus = 'Boy is Manglik while Girl is Non-Manglik. Astrological remedies (Kumbh Vivah) or further consultation advised.';
    manglikCompatible = false;
  } else {
    manglikStatus = 'Girl is Manglik while Boy is Non-Manglik. Traditional remedies or horoscope chart analysis recommended.';
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
      color: 'emerald'
    };
  } else if (totalGunas >= 21) {
    verdict = {
      title: 'Very Good Match (उत्तम संबंध)',
      hindiTitle: 'विवाह हेतु उत्तम मिलन - सुख एवं समृद्धिदायक',
      grade: 'Uttam',
      recommendation: 'Healthy Gun Milan score (21 to 27.5 Gunas). Compatibility is well above traditional threshold (18). Marriage is auspicious.',
      color: 'teal'
    };
  } else if (totalGunas >= 18) {
    verdict = {
      title: 'Average / Acceptable Match (मध्यम संबंध)',
      hindiTitle: 'विवाह योग्य मिलन - सामान्य सामंजस्य',
      grade: 'Madhyam',
      recommendation: 'Meets the minimum Vedic passing threshold (18 Gunas). Specific remedies can be performed for weaker kootas.',
      color: 'amber'
    };
  } else {
    verdict = {
      title: 'Below Passing Threshold (विचारणीय संबंध)',
      hindiTitle: 'अल्प गुण मिलन - ज्योतिषी परामर्श आवश्यक',
      grade: 'Asammat',
      recommendation: 'Score is under 18 Gunas. Detailed family chart analysis and Vedic shanti rituals are recommended prior to finalizing.',
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

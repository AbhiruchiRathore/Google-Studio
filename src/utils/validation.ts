export interface PhoneValidationResult {
  valid: boolean;
  cleaned: string;
  errorEn?: string;
  errorHi?: string;
}

const KNOWN_FAKE_NUMBERS = new Set([
  '9876543210',
  '1234567890',
  '0123456789',
  '6789012345',
  '7890123456',
  '8901234567',
  '9012345678',
  '8765432109',
  '7654321098',
  '6543210987',
  '9988776655',
  '8877665544',
  '7766554433',
  '6655443322',
  '9898989898',
  '9090909090',
  '8080808080',
  '7070707070',
  '6060606060'
]);

/**
 * Sanitizes phone input by stripping non-digits, intelligently handling pasted +91 / 0 prefixes,
 * and strictly enforcing a maximum of 10 digits.
 */
export function sanitizePhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

/**
 * Validates a 10-digit Indian mobile number and rejects fake, sequential, or repetitive numbers.
 */
export function validatePhoneNumber(
  raw: string,
  required: boolean = true
): PhoneValidationResult {
  const cleaned = sanitizePhoneInput(raw);

  if (!cleaned) {
    if (!required) {
      return { valid: true, cleaned: '' };
    }
    return {
      valid: false,
      cleaned: '',
      errorEn: 'Mobile number is required.',
      errorHi: 'मोबाइल नंबर दर्ज करना आवश्यक है।'
    };
  }

  if (cleaned.length !== 10) {
    return {
      valid: false,
      cleaned,
      errorEn: 'Mobile number must be exactly 10 digits (not more or less).',
      errorHi: 'मोबाइल नंबर ठीक 10 अंकों का होना चाहिए (कम या ज़्यादा नहीं)।'
    };
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      errorEn: 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.',
      errorHi: 'कृपया 6, 7, 8 या 9 से शुरू होने वाला मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।'
    };
  }

  // Reject known fake sequences
  if (KNOWN_FAKE_NUMBERS.has(cleaned)) {
    return {
      valid: false,
      cleaned,
      errorEn: 'Fake or sequential numbers are not allowed. Please enter a real mobile number.',
      errorHi: 'नकली या क्रमिक नंबर (जैसे 9876543210) मान्य नहीं हैं। कृपया वास्तविक मोबाइल नंबर दर्ज करें।'
    };
  }

  // Reject 7 or more consecutive identical digits (e.g. 9999999999, 9888888888, 9000000000)
  if (/(\d)\1{6,}/.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      errorEn: 'Repeated identical digits are not allowed. Please enter a genuine mobile number.',
      errorHi: 'एक जैसे बार-बार आने वाले अंक मान्य नहीं हैं। कृपया वास्तविक मोबाइल नंबर दर्ज करें।'
    };
  }

  // Reject repeating 2-digit or 5-digit blocks (e.g. 9898989898, 9876598765)
  if (/^(\d\d)\1{4}$/.test(cleaned) || /^(\d{5})\1$/.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      errorEn: 'Please enter a genuine 10-digit mobile number (repetitive patterns are not allowed).',
      errorHi: 'कृपया वास्तविक 10 अंकों का मोबाइल नंबर दर्ज करें (दोहराए गए पैटर्न मान्य नहीं हैं)।'
    };
  }

  // Reject if a single digit appears 8 or more times anywhere in the 10-digit number
  const freq: Record<string, number> = {};
  for (const ch of cleaned) {
    freq[ch] = (freq[ch] || 0) + 1;
    if (freq[ch] >= 8) {
      return {
        valid: false,
        cleaned,
        errorEn: 'Please enter a valid, real 10-digit mobile number.',
        errorHi: 'कृपया एक मान्य और वास्तविक 10 अंकों का मोबाइल नंबर दर्ज करें।'
      };
    }
  }

  return { valid: true, cleaned };
}

export interface PasswordValidationResult {
  valid: boolean;
  score: number;
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    noSpaces: boolean;
  };
  errorEn?: string;
  errorHi?: string;
}

/**
 * Validates that a password meets strong security standards:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 numeric digit (0-9)
 * - At least 1 special character (!@#$%^&*...)
 * - No whitespace or identical match to username
 */
export function validateStrongPassword(
  password: string,
  username?: string
): PasswordValidationResult {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password),
    noSpaces: password.length > 0 && !/\s/.test(password)
  };

  const score = [
    checks.minLength,
    checks.hasUpper,
    checks.hasLower,
    checks.hasNumber,
    checks.hasSpecial
  ].filter(Boolean).length;

  if (!password) {
    return {
      valid: false,
      score: 0,
      checks,
      errorEn: 'Password is required.',
      errorHi: 'पासवर्ड दर्ज करना आवश्यक है।'
    };
  }

  if (!checks.noSpaces) {
    return {
      valid: false,
      score,
      checks,
      errorEn: 'Password must not contain spaces.',
      errorHi: 'पासवर्ड में रिक्त स्थान (Space) नहीं होना चाहिए।'
    };
  }

  if (!checks.minLength) {
    return {
      valid: false,
      score,
      checks,
      errorEn: 'Password must be at least 8 characters long.',
      errorHi: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।'
    };
  }

  if (!checks.hasUpper) {
    return {
      valid: false,
      score,
      checks,
      errorEn: 'Include at least 1 uppercase letter (A–Z).',
      errorHi: 'पासवर्ड में कम से कम 1 बड़ा अक्षर (A–Z) शामिल करें।'
    };
  }

  if (!checks.hasLower) {
    return {
      valid: false,
      score,
      checks,
      errorEn: 'Include at least 1 lowercase letter (a–z).',
      errorHi: 'पासवर्ड में कम से कम 1 छोटा अक्षर (a–z) शामिल करें।'
    };
  }

  if (!checks.hasNumber) {
    return {
      valid: false,
      score,
      checks,
      errorEn: 'Include at least 1 number (0–9).',
      errorHi: 'पासवर्ड में कम से कम 1 अंक (0–9) शामिल करें।'
    };
  }

  if (!checks.hasSpecial) {
    return {
      valid: false,
      score,
      checks,
      errorEn: 'Include at least 1 special character (e.g. @, #, $, !, %).',
      errorHi: 'पासवर्ड में कम से कम 1 विशेष चिह्न (जैसे @, #, $, !) शामिल करें।'
    };
  }

  if (username && username.trim().length >= 3 && password.toLowerCase().includes(username.trim().toLowerCase())) {
    return {
      valid: false,
      score,
      checks,
      errorEn: 'Password should not contain your username.',
      errorHi: 'पासवर्ड में आपका यूज़रनेम शामिल नहीं होना चाहिए।'
    };
  }

  return {
    valid: true,
    score,
    checks
  };
}


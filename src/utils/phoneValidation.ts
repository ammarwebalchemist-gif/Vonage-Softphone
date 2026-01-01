export interface PhoneValidationResult {
  isValid: boolean;
  normalizedNumber: string;
  errorMessage: string | null;
}

export function validatePhoneNumber(phoneNumber: string): PhoneValidationResult {
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

  if (!cleaned) {
    return {
      isValid: false,
      normalizedNumber: '',
      errorMessage: 'Please enter a phone number',
    };
  }

  const e164Regex = /^\+[1-9]\d{6,14}$/;

  if (!e164Regex.test(cleaned)) {
    if (!cleaned.startsWith('+')) {
      return {
        isValid: false,
        normalizedNumber: cleaned,
        errorMessage: 'Phone number must start with + (E.164 format: +1234567890)',
      };
    }

    if (cleaned.length < 8) {
      return {
        isValid: false,
        normalizedNumber: cleaned,
        errorMessage: 'Phone number is too short (minimum 7 digits after +)',
      };
    }

    if (cleaned.length > 16) {
      return {
        isValid: false,
        normalizedNumber: cleaned,
        errorMessage: 'Phone number is too long (maximum 15 digits after +)',
      };
    }

    return {
      isValid: false,
      normalizedNumber: cleaned,
      errorMessage: 'Please enter a valid phone number (E.164 format: +1234567890)',
    };
  }

  return {
    isValid: true,
    normalizedNumber: cleaned,
    errorMessage: null,
  };
}

export function formatPhoneForDisplay(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }

  if (cleaned.startsWith('+44') && cleaned.length >= 12) {
    return `+44 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }

  return cleaned;
}

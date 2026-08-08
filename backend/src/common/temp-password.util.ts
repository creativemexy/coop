import * as crypto from 'crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*';

export function generateTemporaryPassword(length = 12): string {
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  const bytes = crypto.randomBytes(length + 8);
  const chars = [
    UPPER[bytes[0] % UPPER.length],
    LOWER[bytes[1] % LOWER.length],
    DIGITS[bytes[2] % DIGITS.length],
    SYMBOLS[bytes[3] % SYMBOLS.length],
  ];
  for (let i = 4; i < length; i++) {
    chars.push(all[bytes[i] % all.length]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[i + 4] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function normalizePhoneForSms(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.startsWith('0')) {
    return `234${digits.slice(1)}`;
  }
  return digits;
}

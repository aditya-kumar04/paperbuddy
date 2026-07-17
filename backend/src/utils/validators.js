import crypto from 'crypto';

// Lightweight validation helpers shared across auth/controllers.
// Kept dependency-free (no zod/joi) to match the existing project's minimal style.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

// Minimum bar for account security: 8+ chars, at least one letter and one number.
// (Deliberately not requiring symbols/uppercase — that tends to push users toward
// predictable substitutions like "Password1!" without meaningfully raising entropy.)
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export function getPasswordError(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return null;
}

// Generates a random, human-typeable temporary password (no ambiguous chars like 0/O/l/1).
export function generateTempPassword(length = 10) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[crypto.randomInt(chars.length)];
  }
  return out;
}

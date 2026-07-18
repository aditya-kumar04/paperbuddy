import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/config.js';

// Mirrors the payload shape used by generateTokens() in src/controllers/auth.js.
// Signing tokens directly here (rather than always going through POST /login)
// keeps most tests fast and focused on the endpoint under test; the actual
// login endpoint itself is covered separately in tests/integration/auth.test.js.
export function signAccessToken({ id, role, schoolId = null, permissions = {} }) {
  return jwt.sign({ id, role, schoolId, permissions }, JWT_SECRET, { expiresIn: '1d' });
}

export function authHeader(user) {
  return { Authorization: `Bearer ${signAccessToken(user)}` };
}

// Mirrors the composite-secret reset-token scheme in forgotPassword/resetPassword:
// signed with JWT_SECRET + the user's *current* passwordHash, so it's invalidated
// automatically the moment the password changes.
export function signResetToken(user, { role = 'SCHOOL_ADMIN' } = {}) {
  const resetSecret = JWT_SECRET + user.passwordHash;
  return jwt.sign({ id: user.id, email: user.email, role }, resetSecret, { expiresIn: '15m' });
}

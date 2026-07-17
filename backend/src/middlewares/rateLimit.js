import rateLimit from 'express-rate-limit';

// Tight limiter for credential-guessing-prone endpoints: login, accept-invite,
// forgot/reset password. Keyed by IP; counts only failed/attempted requests
// generously since these endpoints are rarely called at high legitimate volume.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a while before trying again.' },
});

// Looser limiter specifically for password-reset requests, since an attacker
// could otherwise use this endpoint to spam a victim's inbox / enumerate emails.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again later.' },
});

// General-purpose limiter applied to all /api routes as a baseline defense
// against scripted abuse; generous enough to not interfere with normal dashboard use.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

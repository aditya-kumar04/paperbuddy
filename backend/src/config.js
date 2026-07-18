// Centralized environment/config loader.
// Import this FIRST in any entrypoint (server.js) and import the exported
// constants everywhere else instead of reading process.env directly.
// This guarantees .env is loaded before any other module reads it, and
// gives one place to fail fast if required secrets are missing.

import dotenv from 'dotenv';

// Vitest sets NODE_ENV=test automatically. When running tests we load
// .env.test instead of .env, so the test suite always runs against its own
// database and never touches real dev/production secrets.
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing required environment variable(s): ' + missing.join(', '));
  console.error('Copy backend/.env.example to backend/.env and fill in real values.');
  process.exit(1);
}

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const PORT = process.env.PORT || 5000;

// Comma-separated list of allowed origins, e.g. "http://localhost:5173,https://app.paperbuddy.com"
export const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// First entry of ALLOWED_ORIGINS, used when building absolute links (e.g. password reset emails)
export const PRIMARY_FRONTEND_URL = ALLOWED_ORIGINS[0];
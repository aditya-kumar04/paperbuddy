import { execSync } from 'child_process';
import dotenv from 'dotenv';

// This file runs in its own process, before config.js or any test file is
// loaded, so it loads .env.test independently to know which database to
// point Prisma at.
dotenv.config({ path: '.env.test' });

export async function setup() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Copy backend/.env.test.example to backend/.env.test ' +
      'and point it at a dedicated test database before running tests.'
    );
  }

  if (!process.env.DATABASE_URL.includes('test')) {
    // Cheap safety net: refuse to run if the test DB URL doesn't look like a
    // test database, to reduce the chance of accidentally wiping dev data.
    throw new Error(
      'DATABASE_URL in .env.test does not look like a test database (expected "test" in the name). ' +
      'Refusing to run — this suite truncates all tables between test files.'
    );
  }

  console.log('\n[globalSetup] Pushing Prisma schema to test database...');
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env },
  });
}

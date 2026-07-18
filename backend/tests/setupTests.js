import { afterAll } from 'vitest';
import { disconnectDb } from './helpers/db.js';

afterAll(async () => {
  await disconnectDb();
});

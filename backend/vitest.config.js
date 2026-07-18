import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setupTests.js'],
    testTimeout: 15000,
    hookTimeout: 20000,
    // Run test files serially (not in parallel worker pools). The suite
    // shares one Postgres test database and truncates tables between
    // files; running files in parallel would cause them to stomp on
    // each other's data.
    fileParallelism: false,
  },
});

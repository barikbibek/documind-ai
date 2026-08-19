import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      DATABASE_URL: 'postgres://localhost/test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'testsecret',
      GEMINI_API_KEY: 'testkey',
    }
  },
});

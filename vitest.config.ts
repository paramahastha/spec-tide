import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      include: ['apps/**/*.ts', 'packages/**/*.ts'],
      thresholds: { lines: 70, functions: 65, branches: 60, statements: 70 },
    },
    projects: [
      { test: { name: 'unit', include: ['tests/unit/**/*.test.ts'] } },
      { test: { name: 'contract', include: ['tests/contract/**/*.test.ts'] } },
      { test: { name: 'integration', include: ['tests/integration/**/*.test.ts'] } },
      { test: { name: 'e2e', include: ['tests/e2e/**/*.test.ts'] } },
    ],
  },
});

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@rks/protocol': fileURLToPath(new URL('./packages/protocol/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      lines: 0.9,
      statements: 0.9,
      functions: 0.9,
      branches: 0.9,
      include: ['src/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    },
    globals: true,
    include: ['src/**/*.spec.ts', 'packages/**/*.spec.ts'],
  },
});

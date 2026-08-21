/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Path aliases (@, @components, @utils, etc.) come from tsconfig.json's
// "paths" via Vite's native resolve.tsconfigPaths option — not duplicated
// here. Note: tsconfig's
// "@core/*" and "@shared/*" resolve relative to baseUrl ("src"), i.e. inside
// frontend/, which differs from the old craco.config.js webpack alias (which
// pointed both at the repo root). Neither is actually imported anywhere in
// frontend/src today (verified), so this is inert — but if either alias is
// ever used, resolve the mismatch then rather than assuming this comment is
// still accurate.
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
  },
});

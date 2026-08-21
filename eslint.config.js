import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**'],
  },
  js.configs.recommended,
  // typescript-eslint's rule-bearing config entries here carry no `files`
  // restriction, so these rules apply repo-wide, including plain backend
  // .js files — intentional, not a bug.
  ...tseslint.configs.recommended,
  {
    files: ['backend/**/*.{js,cjs,mjs}', '*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['api/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['shared/**/*.{js,ts}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: globals.browser,
    },
    settings: {
      // Hardcoded, not 'detect': eslint-plugin-react@7.37.5's version-detection
      // code calls context.getFilename(), which ESLint 10 removed entirely
      // (replaced by context.filename) — 'detect' crashes ESLint on every
      // frontend file. No newer eslint-plugin-react release exists yet that
      // fixes this. Bump this string manually when React's major version
      // changes.
      react: { version: '19.2.8' },
    },
  },
  {
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],
    ...react.configs.flat['jsx-runtime'],
  },
  {
    // Pinned to the 2 classic hooks rules explicitly rather than spreading
    // in eslint-plugin-react-hooks v7's full "recommended" config, which now
    // bundles ~14 additional React Compiler rules (purity, immutability,
    // set-state-in-effect, etc.) this project's code was never written
    // against — the project uses no React Compiler tooling. Revisit if that
    // changes.
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],
    ...jsxA11y.flatConfigs.recommended,
    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      globals: globals.browser,
    },
  },
  eslintConfigPrettier
);

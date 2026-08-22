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
      // package.json pins eslint to ^10.8.1 (10.x is installed — the caret range
      // drifts with every install, so don't rely on this comment for the exact
      // patch version; check `npm ls eslint` if it matters), but neither
      // React-related plugin's peer range covers ESLint 10 yet:
      // eslint-plugin-react@7.37.5 peers on
      // '^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7', eslint-plugin-jsx-a11y@6.10.2
      // peers on '^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9' — both are each
      // package's current latest release, so there's no newer version to move to
      // yet. package.json's `overrides` block forces npm to install anyway; that
      // only resolves the peer conflict for `npm install`, it adds no runtime
      // compatibility.
      //
      // One concrete break from this gap is already known and mitigated here:
      // eslint-plugin-react's 'detect' version-autodetection calls
      // context.getFilename(), which ESLint 10 removed entirely (replaced by
      // context.filename) — 'detect' crashes ESLint on every frontend file, so
      // the version is hardcoded below instead. Bump this string manually when
      // React's major version changes.
      //
      // Whether either plugin calls any *other* ESLint-9-only API is unverified —
      // neither plugin advertises ESLint 10 support, so nothing rules it out;
      // `npm run lint` currently completes without crashing, but that only proves
      // this one path is safe. To close the gap for real: pin `eslint` and
      // `@eslint/js` to `9.7.x` (the highest version both plugins' peer ranges
      // cover), or upgrade both plugins once they publish a release with ESLint 10
      // in their peer range — check with `npm view eslint-plugin-react
      // peerDependencies` and `npm view eslint-plugin-jsx-a11y peerDependencies`.
      react: { version: '19.2.8' },
    },
  },
  {
    files: ['frontend/**/*.{ts,tsx}'],
    rules: {
      'react/prop-types': 'off',
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

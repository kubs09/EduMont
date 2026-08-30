import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
// Pre-1.0 successor to eslint-plugin-jsx-a11y (v0.2.0 as of this migration) — chosen
// because it's a verified same-rule-set replacement with ESLint 10 support, but it's
// young. See docs/superpowers/specs/2026-08-24-eslint10-migration-design.md for the
// full risk rationale if a11y-lint behavior looks off.
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      // Linked git worktrees (this repo and agent-session sandboxes both create
      // these) have no node_modules of their own, so Node's module resolution
      // falls through to this checkout's node_modules — meaning a stale worktree
      // importing a package this checkout no longer has crashes `eslint .` here
      // instead of just being a stale checkout. Not scoped to a single worktree
      // name since new ones come and go.
      '.worktrees/**',
      '.claude/worktrees/**',
    ],
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
    plugins: { '@eslint-react': eslintReact },
    languageOptions: {
      // Preserved from eslint-plugin-react's old `recommended` config, which also
      // set this — kept explicitly rather than dropped, even though every current
      // frontend file is either .tsx (parsed by @typescript-eslint/parser, which
      // detects JSX from the extension regardless of this flag) or a JSX-free .js
      // file, so this had no observable effect before or after the swap; kept for
      // safety against a future plain .jsx file where it would matter.
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    rules: {
      // Hand-picked to match eslint-plugin-react@7.37.5's `recommended` + `jsx-runtime`
      // coverage exactly (see docs/superpowers/specs/2026-08-24-eslint10-migration-design.md
      // for the full old-rule -> new-rule mapping and why the packaged
      // `recommended-typescript` config isn't used: it duplicates the react-hooks
      // rules below and adds ~15 unrelated rule categories).
      '@eslint-react/no-missing-component-display-name': 'error',
      '@eslint-react/no-missing-key': 'error',
      '@eslint-react/no-duplicate-key': 'error',
      '@eslint-react/jsx-no-comment-textnodes': 'error',
      '@eslint-react/dom-no-unsafe-target-blank': 'error',
      '@eslint-react/jsx-no-children-prop': 'error',
      '@eslint-react/dom-no-dangerously-set-innerhtml-with-children': 'error',
      '@eslint-react/no-direct-mutation-state': 'error',
      '@eslint-react/dom-no-find-dom-node': 'error',
      '@eslint-react/dom-no-render-return-value': 'error',
      '@eslint-react/dom-no-unknown-property': 'error',
      // These 8 replace the lifecycle/render-method portion of eslint-plugin-react's
      // single blanket `no-deprecated` rule — NOT a complete replacement. That old
      // rule also flagged React.createClass, React.PropTypes, React.DOM.*,
      // React.addons.*, and ReactDOM.unmountComponentAtNode (deprecated in React 18
      // alongside render/hydrate, which ARE covered below); none of those have any
      // equivalent anywhere in @eslint-react's 140 exported rules (verified by direct
      // keyword search against the installed package). No current usage of any of
      // them in this codebase, so not an active problem, but silently unflagged if
      // one reappears — same accepted-gap treatment as the two rules noted below.
      '@eslint-react/no-component-will-mount': 'error',
      '@eslint-react/no-component-will-receive-props': 'error',
      '@eslint-react/no-component-will-update': 'error',
      '@eslint-react/no-unsafe-component-will-mount': 'error',
      '@eslint-react/no-unsafe-component-will-receive-props': 'error',
      '@eslint-react/no-unsafe-component-will-update': 'error',
      '@eslint-react/dom-no-hydrate': 'error',
      '@eslint-react/dom-no-render': 'error',
      // No @eslint-react equivalent exists for these two either (verified by
      // exhaustive keyword search of the plugin's 140 exported rules during design;
      // @eslint-react/kit is a beta build-your-own-rule framework, not a rule
      // library, so a custom implementation was judged disproportionate here):
      //   - jsx-no-duplicate-props (duplicate JSX attributes on one element)
      //   - no-unescaped-entities (raw '>' / '"' etc. in JSX text content)
      // Revisit any of these if they become a real problem in practice.
    },
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
    ...jsxA11y.configs.recommended,
    languageOptions: {
      ...jsxA11y.configs.recommended.languageOptions,
      globals: globals.browser,
    },
  },
  eslintConfigPrettier
);

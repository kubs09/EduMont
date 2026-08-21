# Node.js 24 Upgrade — Design

## Goal

Move the project's Node.js baseline from an unpinned/EOL state to Node 24.x, matching
Vercel's current default runtime and giving the longest support runway (Node 24 is
Active LTS until 2028-04-30).

## Why now

- Root `package.json` pins `engines.node` to `>=16.x` — effectively no real floor.
- CI (`.github/workflows/ci.yml`) pins **Node 18** for every job (lint, frontend,
  backend, migrate-production). Node 18 reached end-of-life 2025-04-30.
- Node 20 — the version actually installed on the developer machine used for this
  audit (v20.17.0) — is also past its useful window: Vercel is disabling Node 20 in
  Project Settings on 2026-10-01.
- `@supabase/supabase-js@2.87.1`, already a real dependency, declares
  `engines.node: ">=20.0.0"`. CI's Node 18 pin is already below what one of the
  project's own dependencies requires; npm just doesn't enforce it today because
  `engine-strict` isn't set.
- Only Node 22 (Maintenance LTS, EOL 2027-04-30) and Node 24 (Active LTS, EOL
  2028-04-30, and Vercel's current default for new projects) are realistic targets.
  Node 24 was chosen for the longer runway and because it avoids a second upgrade
  in the near term.

## Scope

**In scope:**
- Pin `engines.node` to `"24.x"` in all three `package.json` files (root, `backend/`,
  `frontend/`)
- Add `.npmrc` with `engine-strict=true` at root, `backend/`, and `frontend/` so a
  mismatched Node version hard-fails `npm install` instead of warning
- Add `.nvmrc` (content: `24`) at root, `backend/`, and `frontend/` for local dev
  parity via `nvm use`
- Bump `.github/workflows/ci.yml` from `node-version: '18'` to `'24'` across all four
  jobs (lint, frontend, backend, migrate-production)
- Remove the dead `"crypto": "^1.0.1"` entry from root `dependencies` — Node's builtin
  `crypto` module always wins over a userland package for the bare `crypto` specifier
  in both CommonJS `require` and ESM `import`, so this deprecated npm placeholder
  package does nothing. Verified: the only real usages of `crypto` in project source
  (`backend/routes/auth/services/token.js`, `backend/routes/users/services/email.js`)
  resolve to Node's builtin regardless of this dependency's presence.
- Regenerate `package-lock.json` in all three locations under Node 24
- Install Node 24 locally (via nvm-windows or the official installer) and run
  lint, backend tests, frontend tests, and frontend build against it as part of
  implementation verification, in addition to CI

**Out of scope:**
- No dependency major-version bumps (Express 5, ESLint 9, TypeScript, Prettier 3,
  `@typescript-eslint` 8, CRA/craco alternatives, etc.). `npm outdated` surfaced many
  of these; they are a separate, larger effort with breaking changes and are
  deliberately deferred.
- No CI version matrix — single Node 24 target only, matching what's actually
  deployed.
- No `vercel.json` changes. Vercel reads `engines.node` from the root
  `package.json`, and that override takes precedence over the dashboard's Node
  Version project setting (per Vercel docs), so pinning root's `engines.node` is
  sufficient. A manual sanity check of the Vercel dashboard's Build & Deployment →
  Node.js Version setting after merging is worthwhile but requires no repo change.

## Code changes expected

None beyond the config/dependency changes above. Confirmed via search:
- No deprecated Node API usage (`new Buffer()`, `url.parse()`, `process.binding()`,
  `domain.create()`, `createCipher()`) in actual project source — only in
  third-party `node_modules`, which remain functional (soft-deprecated, not removed)
  on Node 24.
- `backend/package.json`'s `node --experimental-vm-modules ... jest` test scripts
  remain valid; Jest 30 still requires this flag for ESM support on Node 24.
- `backend/package.json`'s `"start": "node --watch server.js"` is unaffected;
  `--watch` has been stable since Node 20.

## Verification plan

1. Install Node 24 locally (nvm-windows or official installer).
2. Under Node 24, run: `npm run lint` (root), `npm test --prefix backend`
   (includes a local Postgres test DB setup/migration per existing scripts),
   `npm test --prefix frontend -- --watchAll=false`, `npm run build --prefix
   frontend`.
3. Push the branch and confirm the updated GitHub Actions CI (Node 24 across all
   jobs) passes — this is the authoritative gate since it mirrors what Vercel
   actually runs against, including the real Postgres service container.
4. After merge, spot-check the Vercel dashboard's Node.js Version setting to
   confirm nothing there conflicts with the `engines.node` override.

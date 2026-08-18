# Node.js 24 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin the project (root, `backend/`, `frontend/`, CI) to Node.js 24.x, remove the dead `crypto` npm package, and verify lint/tests/build pass on Node 24 both locally and in CI.

**Architecture:** This is a config/tooling change, not a feature change — no application code is expected to move. Each task edits one config surface (a `package.json` engines field, a new `.npmrc`/`.nvmrc`, or the CI workflow), then verifies the change with a real command. No new source code, so there are no unit tests to write; "verification" means running the project's existing lint/test/build scripts and checking their output.

**Tech Stack:** Node.js 24.x, npm, nvm-windows (for local version management), GitHub Actions, Jest, ESLint, CRA/craco.

**Reference spec:** `docs/superpowers/specs/2026-08-18-node-24-upgrade-design.md`

**Standing project rule:** Never run `git commit` without asking the user first. Every task below stages changes with `git add`; nothing is committed until the final task, where you present the staged diff and wait for explicit go-ahead.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `package.json` (root) | Modify | `engines.node` → `"24.x"`; remove dead `crypto` dependency |
| `backend/package.json` | Modify | Add `engines.node: "24.x"` |
| `frontend/package.json` | Modify | Add `engines.node: "24.x"` |
| `.npmrc` (root) | Create | `engine-strict=true` |
| `backend/.npmrc` | Create | `engine-strict=true` |
| `frontend/.npmrc` | Create | `engine-strict=true` |
| `.nvmrc` (root) | Create | `24` |
| `backend/.nvmrc` | Create | `24` |
| `frontend/.nvmrc` | Create | `24` |
| `.github/workflows/ci.yml` | Modify | `node-version: '18'` → `'24'` in all 4 jobs |
| `package-lock.json` (root, `backend/`, `frontend/`) | Regenerated | Reflect `crypto` removal, refresh under Node 24 |

---

## Task 1: Install Node 24 locally

**Files:** none (machine-level tooling only)

- [ ] **Step 1: Check for an existing Node version manager**

Run: `nvm version`
Expected: either a version number (nvm-windows already installed) or "command not found".

- [ ] **Step 2: Install nvm-windows if missing**

Only if Step 1 reported "command not found". Ask the user before installing anything on their machine.

Run: `winget install CoreyButler.NVMforWindows`

After install, open a new shell (PATH won't update in the current one) and re-run `nvm version` to confirm it's on PATH.

- [ ] **Step 3: Install and activate Node 24**

Run:
```
nvm install 24
nvm use 24
```

- [ ] **Step 4: Verify the active Node version**

Run: `node -v`
Expected: `v24.x.x`

Keep this shell (or any new shell after `nvm use 24`) active for the rest of this plan — all `npm`/`node` commands below assume Node 24 is active. Re-run `node -v` before Task 5 and Task 7 if you switch shells.

---

## Task 2: Root package.json + .npmrc + .nvmrc

**Files:**
- Modify: `package.json` (root)
- Create: `.npmrc` (root)
- Create: `.nvmrc` (root)

- [ ] **Step 1: Update `engines` and remove the dead `crypto` dependency**

Current relevant section of `package.json`:
```json
  "dependencies": {
    "@craco/craco": "^5.9.0",
    "bcryptjs": "^3.0.2",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "crypto": "^1.0.1",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "module-alias": "^2.2.3",
    "nodemailer": "^8.0.1",
    "pg": "^8.11.0"
  },
```
and
```json
  "engines": {
    "node": ">=16.x"
  }
```

Edit to:
```json
  "dependencies": {
    "@craco/craco": "^5.9.0",
    "bcryptjs": "^3.0.2",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "module-alias": "^2.2.3",
    "nodemailer": "^8.0.1",
    "pg": "^8.11.0"
  },
```
and
```json
  "engines": {
    "node": "24.x"
  }
```

(`crypto` is a deprecated npm placeholder package; Node's builtin `crypto` module always wins over it for the bare specifier, so this is dead weight, not a functional dependency — confirmed in the design spec.)

- [ ] **Step 2: Create root `.npmrc`**

Content:
```
engine-strict=true
```

- [ ] **Step 3: Create root `.nvmrc`**

Content:
```
24
```

- [ ] **Step 4: Stage the changes**

```bash
git add package.json .npmrc .nvmrc
```

---

## Task 3: Backend package.json + .npmrc + .nvmrc

**Files:**
- Modify: `backend/package.json`
- Create: `backend/.npmrc`
- Create: `backend/.nvmrc`

- [ ] **Step 1: Add `engines` to `backend/package.json`**

Current end of file:
```json
  "imports": {
    "#backend/*": "./*"
  }
}
```

Edit to:
```json
  "imports": {
    "#backend/*": "./*"
  },
  "engines": {
    "node": "24.x"
  }
}
```

- [ ] **Step 2: Create `backend/.npmrc`**

Content:
```
engine-strict=true
```

- [ ] **Step 3: Create `backend/.nvmrc`**

Content:
```
24
```

- [ ] **Step 4: Stage the changes**

```bash
git add backend/package.json backend/.npmrc backend/.nvmrc
```

---

## Task 4: Frontend package.json + .npmrc + .nvmrc

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/.npmrc`
- Create: `frontend/.nvmrc`

- [ ] **Step 1: Add `engines` to `frontend/package.json`**

Current relevant section:
```json
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

Edit to:
```json
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "engines": {
    "node": "24.x"
  }
}
```

- [ ] **Step 2: Create `frontend/.npmrc`**

Content:
```
engine-strict=true
```

- [ ] **Step 3: Create `frontend/.nvmrc`**

Content:
```
24
```

- [ ] **Step 4: Stage the changes**

```bash
git add frontend/package.json frontend/.npmrc frontend/.nvmrc
```

---

## Task 5: Regenerate lockfiles under Node 24

**Files:**
- Modify: `package-lock.json` (root)
- Modify: `backend/package-lock.json`
- Modify: `frontend/package-lock.json`

- [ ] **Step 1: Confirm Node 24 is still active**

Run: `node -v`
Expected: `v24.x.x`. If not, run `nvm use 24` again (nvm-windows doesn't persist across shells automatically).

- [ ] **Step 2: Reinstall root deps**

Run: `npm install`
Expected: exits 0. With `engine-strict=true` now in effect, this will hard-fail if the active Node doesn't satisfy `24.x` — that failure would mean Step 1 didn't actually switch versions; fix that before continuing. `package-lock.json` should now be missing the `crypto` entry and reflect `engines: 24.x`.

- [ ] **Step 3: Reinstall backend deps**

Run: `npm install --prefix backend`
Expected: exits 0.

- [ ] **Step 4: Reinstall frontend deps**

Run: `npm install --prefix frontend`
Expected: exits 0.

- [ ] **Step 5: Confirm `crypto` is gone from the root lockfile**

Run: `grep -c "\"crypto\":" package-lock.json`
Expected: no match on the top-level dependency entry (nested/unrelated matches inside transitive packages named differently are fine — just confirm the root-level `crypto` package entry itself is gone). If unsure, open `package-lock.json` and search for a top-level `"node_modules/crypto"` key — it should not exist.

- [ ] **Step 6: Stage the lockfiles**

```bash
git add package-lock.json backend/package-lock.json frontend/package-lock.json
```

---

## Task 6: Bump CI to Node 24

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Replace all four `node-version: '18'` occurrences**

The string `node-version: '18'` appears identically in all four jobs (`lint`, `frontend`, `backend`, `migrate-production`). Replace all occurrences with `node-version: '24'`.

- [ ] **Step 2: Verify the replacement**

Run: `grep -n "node-version" .github/workflows/ci.yml`
Expected: 4 lines, all showing `node-version: '24'`.

- [ ] **Step 3: Stage the change**

```bash
git add .github/workflows/ci.yml
```

---

## Task 7: Local verification on Node 24

**Files:** none (verification only)

- [ ] **Step 1: Confirm Node 24 is active**

Run: `node -v`
Expected: `v24.x.x`

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exits 0, no errors.

- [ ] **Step 3: Frontend tests**

Run: `npm test --prefix frontend -- --watchAll=false`
Expected: all tests pass.

- [ ] **Step 4: Frontend build**

Run: `npm run build --prefix frontend`
Expected: exits 0, `frontend/build/` produced.

- [ ] **Step 5: Backend tests (only if a local Postgres test DB is available)**

The backend test suite needs a Postgres instance matching `backend`'s `POSTGRES_*` env vars (CI spins one up as a service container; locally this depends on what's already configured on this machine). If a local Postgres is available and configured:

```bash
npm run test:db:create --prefix backend
npm run test:db:migrate --prefix backend
npm test --prefix backend
```
Expected: all tests pass.

If no local Postgres is configured, skip this step — it's not something the Node upgrade introduces or requires, and CI's Postgres service container (Task 6) will cover this check. Note in your final summary to the user that backend tests were verified via CI only, not locally.

- [ ] **Step 6: Record results**

No commit here — this task only verifies; nothing new to stage.

---

## Task 8: Review and commit

**Files:** none (process step)

- [ ] **Step 1: Show the full staged diff to the user**

Run: `git status` and `git diff --staged`

- [ ] **Step 2: Ask for explicit commit approval**

Per the standing project rule, do not run `git commit` until the user explicitly confirms. Summarize what's staged (config files across root/backend/frontend, CI workflow, three regenerated lockfiles) and ask if they want it committed now, committed with edits, or left staged.

- [ ] **Step 3: Commit only after approval**

If approved, commit with a message describing the Node 24 upgrade (config/CI/lockfiles, dead `crypto` dependency removal). Do not push unless separately asked.

---

## Post-merge manual check (not part of this plan's file changes)

After this lands on `main` and deploys, spot-check the Vercel dashboard's **Build & Deployment → Node.js Version** setting to confirm it isn't pinned to something stale that would conflict with the `engines.node` override (per Vercel docs, the `package.json` override wins regardless, but worth confirming there's no surprise). This is a dashboard-only check, no repo change.

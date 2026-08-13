# Auth Endpoint Tests (login, signup) — Design

## Context

The backend test suite (`backend/tests/`) currently covers only the three
`auth/password-reset` endpoints (`check-token`, `forgot-password`,
`reset-password`), each with a unit test (mocked DB) and an integration test
(real Postgres test DB) pair.

This is the first of a series of sub-projects that will bring the rest of the
API's endpoints (children, classes, documents, messages, permissions,
presentations, users — ~39 endpoint files total) up to the same test
coverage, one domain at a time. This sub-project covers the two remaining
untested `auth` endpoints: `POST /api/login` and `POST /api/signup`
([login.js](../../../backend/routes/auth/login.js),
[signup.js](../../../backend/routes/auth/signup.js)).

Both routes are public (no `authenticateToken` middleware), so this
sub-project does not need to establish an auth-mocking convention — that is
deferred to the first domain that requires it (children).

## Scope

Four new test files, following the existing directory convention:

- `backend/tests/unit/routes/auth/login.test.js`
- `backend/tests/unit/routes/auth/signup.test.js`
- `backend/tests/integration/routes/auth/login.test.js`
- `backend/tests/integration/routes/auth/signup.test.js`

## Shared helper change

`signup.js` is the first tested route that performs an insert
(`tx.insert(users).values({...}).returning(...)`). The current `makeChain` in
[drizzleMock.js](../../../backend/tests/helpers/drizzleMock.js) supports
`.from/.where/.set/.limit/.returning` but not `.values()`. Add:

```js
chain.values = jest.fn(returnChain);
```

to `makeChain`, so insert chains work the same way select/update chains
already do. This is additive and does not change existing test behavior.

## Unit tests

Follow the existing pattern exactly: `jest.unstable_mockModule` for
`#backend/config/mail.js` and `#backend/config/database.js`, dynamic
`await import('#backend/server.js')`, `jest.clearAllMocks()` in
`beforeEach`. Password hashing (bcrypt) and JWT signing run for real (not
mocked), matching how `reset-password.test.js` already exercises real
`hashPassword`.

### `login.test.js` — `POST /api/login`

Mock `db.select` only (matches what `login.js` calls).

1. 400 when `email` is missing — validation error, `db.select` not called
2. 400 when `password` is missing — validation error, `db.select` not called
3. 401 for an unknown email (`db.select` resolves `[]`)
4. 401 for a wrong password (mocked row has a real bcrypt hash of a
   different password than the one submitted)
5. 200 with `token` (string) and user fields (`id`, `firstname`, `surname`,
   `role`, `email`, `messageNotifications`, `phone`) for valid credentials;
   decode the returned JWT and assert `id`/`role` match the mocked user
   instead of asserting an exact token string

### `signup.test.js` — `POST /api/signup`

Mock `db.transaction`, invoking the callback with a `tx` mock
(`tx.select`, `tx.insert`), same style as `reset-password.test.js`'s
transaction tests.

1. 400 for missing email
2. 400 for missing password
3. 400 for password shorter than 6 characters
4. 400 for invalid email format
5. 400 for missing first/last name
6. 400 "Email already registered" when `tx.select` finds an existing user
   (assert `tx.insert` is NOT called)
7. 201 with created user (`id`, `email`, `firstname`, `surname`,
   `role: 'parent'`) on success; assert the response body does not include
   a `password`/hash field

## Integration tests

Real test DB via `db`/`pool` from `#backend/config/database.js`, same
pattern as `check-token.test.js` (integration): mock only `mail`, create
rows directly for setup, clean up in `afterEach`, `pool.end()` in
`afterAll`.

### `login.test.js` (integration)

1. Insert a user with a known bcrypt-hashed password directly via `db`;
   `POST /api/login` with correct credentials returns 200 and a token that
   decodes to the right `id`/`role`
2. Same user, wrong password → 401
3. Unknown email → 401

### `signup.test.js` (integration)

1. `POST /api/signup` with valid new-user data → 201; verify the row exists
   in `users` via a follow-up `db.select`; clean up in `afterEach`
2. Insert a user first, then `POST /api/signup` with the same email → 400
   "Email already registered"

## Out of scope

- Internal error-handler branches in `login.js` (DB connection failure →
  503, JWT generation failure when `JWT_SECRET` is unset → 500) — the
  existing suite doesn't test equivalent branches elsewhere either, so this
  sub-project matches that depth rather than adding new coverage patterns.
- Any other domain (children, classes, documents, messages, permissions,
  presentations, users) — each gets its own design/plan cycle, starting
  with children next.

# FloQast Quality Engineering Take-Home Assessment

A Playwright + TypeScript test framework for a small mock application. It covers user registration and money-transfer workflows through both browser UI tests and direct API tests.

## What is covered

- User creation and retrieval: validation, duplicate email, not-found, and authorization cases.
- Transfers: successful balance/history updates plus invalid input, recipient, funds, authentication, and authorization cases.
- UI behavior: client-side validation, success/reset behavior, and targeted server-error responses.

The browser tests use `page.route()` only for focused UI response scenarios. Direct API tests make normal HTTP requests to the local mock server.

## Local mock architecture

```text
Playwright UI tests ──browser──> mock-ui/ ──fetch──> mock-server/
Playwright API tests ──HTTP request fixture────────> mock-server/
```

- `mock-ui/` is a static HTML/JavaScript interface for user registration (`/`) and transfers (`/transactions.html`).
- `mock-server/` is an Express server with seeded, in-memory users, balances, and transaction histories. `POST /test/reset` restores the seed state for isolated transfer API tests.
- The server exposes `POST /api/users`, `GET /api/users/:id`, `POST /api/transactions`, and `GET /api/transactions/:userId`.

Authentication is deliberately test-only. The transfer UI has a static Alice session (`alice-token`); there is no login flow, token issuance, persistence, or real identity provider. The server uses a fixed token map for Alice, Bob, Admin, and an expired-token case to exercise authorization behavior. It is not production authentication.

## Setup and configuration

Prerequisites: Node.js 22+, npm, and an available port 3001.

```bash
npm install
npx playwright install chromium firefox
cp .env.example .env
```

For the bundled local mocks, use:

```dotenv
TEST_ENV=local
UI_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001
USE_MOCKS=true
```

`config/environment.ts` accepts `local`, `dev`, `stg`, and `prd`. `local` defaults both URLs to `http://localhost:3001`; other environments require both URLs. `USE_MOCKS=true` starts `node mock-server/server.js` through Playwright's `webServer` configuration. With `USE_MOCKS=false`, tests target the configured URLs and do not start the local server.

## Run tests

With local mocks enabled, Playwright starts the server automatically.

| Command | Scope |
| --- | --- |
| `npm test` | All tests in Chromium and Firefox. |
| `npm run test:chromium` | All tests in Chromium. |
| `npm run test:usersuitests` | Both UI test files. |
| `npm run test:usersapitests` | Both direct API test files. |
| `npm run test:transactionuitests` | Transfer UI suite, serially. |
| `npm run test:transactionapitests` | Transfer API suite, serially. |
| `npm run report` | Open the latest HTML report. |

To run the mock app outside Playwright, use `node mock-server/server.js` and open `http://localhost:3001`.

## Results and logs

| Artifact | Location |
| --- | --- |
| Playwright HTML report | `playwright-report/` |
| JSON results and failure artifacts | `test-results/` |
| Per-test API request/response logs | `test-results/<test-output-folder>/api.log` |
| Current mock-server request log | `mock-server/logs/server.log` |

The server log is recreated on each server start and records method, URL, status, and duration. Playwright captures screenshots on failure and traces on the first retry. Generated Playwright output and `.env` are ignored by Git.

## AI assistance disclosure

AI was used as a learning and pair-programming aid for code review, Playwright/TypeScript explanations, documentation, and implementation guidance. The author reviewed the final scope and code.

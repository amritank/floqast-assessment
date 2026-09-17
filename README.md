# FloQast Quality Engineering Take-Home Assessment

A Playwright + TypeScript test framework for a small mock application. It covers user registration and money-transfer workflows through both browser UI tests and direct API tests.

## What is covered

- User creation and retrieval: validation, duplicate email, not-found, and authorization cases.
- Transfers: successful balance/history updates plus invalid input, recipient, funds, authentication, and authorization cases.
- UI behavior: client-side validation, success/reset behavior, and targeted server-error responses.
- End-to-end workflow: registers a user through the real UI and mock server, transfers funds from Alice to that new user through the real transaction UI, then verifies both balances and transaction histories through the API.

The browser tests use `page.route()` only for focused UI response scenarios. Direct API tests make normal HTTP requests to the local mock server.

## Local mock architecture

```text
Playwright UI tests ──browser──> mock-ui/ ──fetch──> mock-server/
Playwright API tests ──HTTP request fixture────────> mock-server/
```

- `mock-ui/` is a static HTML/JavaScript interface for user registration (`/`) and transfers (`/transactions.html`).
- `mock-server/` is an Express server with seeded, in-memory users, balances, and transaction histories. `POST /test/reset` restores the seed state for isolated transfer API tests.
- The server exposes `POST /api/users`, `GET /api/users/:id`, `POST /api/transactions`, and `GET /api/transactions/:userId`.

### Money values

The UI accepts transfer amounts in dollars, but the server stores balances and transaction amounts as integer cents (`balanceCents` and `amountCents`). For example, an input of `$10.00` becomes `1000` cents; a balance of `9000` means `$90.00`. This avoids floating-point rounding errors in money calculations.

Authentication is deliberately test-only. The transfer UI has a static Alice session (`alice-token`); there is no login flow, token issuance, persistence, or real identity provider. The server uses a fixed token map for Alice, Bob, Admin, and an expired-token case to exercise authorization behavior. It is not production authentication.

## Project structure

```text
config/                 Environment selection and base URLs
data/                   TypeScript test-data factories for users and transfers
mock-ui/                Static registration and transfer pages plus browser API client
mock-server/
  data/                 Seed users and in-memory Maps
  middleware/           Authentication and server logging
  routes/               User, transaction, and test-reset routes
tests/
  api-tests/            Direct Playwright API coverage
  ui-tests/             Browser UI tests with targeted route interception
  e2e-tests/            Real UI + mock-server workflow coverage
  assertions/           Reusable UI and API assertions
  utils/                Test request helpers
utils/                  API request/response logging utility
```

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

| Command                            | Scope                                                         |
| ---------------------------------- | ------------------------------------------------------------- |
| `npm test`                         | All tests in Chromium and Firefox.                            |
| `npm run test:chromium`            | All tests in Chromium.                                        |
| `npm run test:usersuitests`        | Both UI test files.                                           |
| `npm run test:usersapitests`       | Both direct API test files.                                   |
| `npm run test:transactionuitests`  | Transfer UI suite, serially.                                  |
| `npm run test:transactionapitests` | Transfer API suite, serially.                                 |
| `npm run test:e2etests`            | End-to-end user-registration and transfer workflow, serially. |
| `npm run report`                   | Open the latest HTML report.                                  |

To run the mock app outside Playwright, use `node mock-server/server.js` and open `http://localhost:3001`.

## Results and logs

| Artifact                           | Location                                    |
| ---------------------------------- | ------------------------------------------- |
| Playwright HTML report             | `playwright-report/`                        |
| JSON results and failure artifacts | `test-results/`                             |
| Per-test API request/response logs | `test-results/<test-output-folder>/api.log` |
| Current mock-server request log    | `mock-server/logs/server.log`               |

The server log is recreated on each server start and records method, URL, status, and duration. Playwright captures screenshots on failure and traces on the first retry. Generated Playwright output and `.env` are ignored by Git.

## AI assistance disclosure

The author designed and wrote the framework and test code, chose the folder structure, created the initial test scenarios, and made the final framework and coverage decisions. AI was used as a learning and pair-programming aid for Playwright/TypeScript explanations, code review, and documentation guidance.

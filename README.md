# FloQast Quality Engineering Take-Home Assessment

This repository is a small Playwright + TypeScript test framework created for a Quality Engineering take-home assessment. It currently demonstrates a **User Registration** workflow with both browser-based UI tests and direct API tests.

The project deliberately includes a lightweight local mock application rather than depending on an unavailable real system. The mock application has:

- a plain HTML/JavaScript User Registration UI;
- an Express mock server with an in-memory data store seeded from JSON;
- `POST /api/users` and `GET /api/users/:id` endpoints;
- validation, duplicate-email handling, request/response logging, and test reporting.

Transactions and authentication/authorization are planned next; they are not implemented or documented as working behavior yet.

## Architecture

There is no separate "test server." Playwright Test is the runner. When local mocks are enabled, the Playwright `webServer` configuration starts the Node/Express mock server before tests run.

```text
                              +---------------------------+
                              |     Playwright Test        |
                              |  Chromium / Firefox runner |
                              +------------+--------------+
                                           |
                  +------------------------+------------------------+
                  |                                                 |
                  v                                                 v
       +---------------------+                         +----------------------+
       | UI tests            |                         | Direct API tests     |
       | tests/ui-tests      |                         | tests/api-tests      |
       +----------+----------+                         +----------+-----------+
                  |                                                 |
                  | browser UI actions                              | HTTP request fixture
                  v                                                 v
       +---------------------+                         +----------------------+
       | Mock UI             |---- fetch /api/users -->| Express mock server  |
       | mock-ui/            |                         | mock-server/         |
       +---------------------+                         +----------+-----------+
                  ^                                                 |
                  | serves static files                             v
                  +------------------------------------+  +------------------+
                                                       |  | In-memory Maps   |
                                                       |  | seeded from JSON |
                                                       |  +------------------+
                                                       |
                                      UI tests can use page.route() to replace
                                      individual API responses for UI-only cases.
```

`page.route()` is used in the UI suite for targeted browser-side outcomes such as `201`, `409`, and `500`. Direct API tests send ordinary HTTP requests to the configured API URL and exercise the local server.

## Project structure

```text
config/
  environment.ts             Environment parsing and validation
data/
  users.ts                   User test-data factory
mock-ui/
  index.html                 User Registration form
  app.js                     Browser validation and form behavior
  api.js                     Browser API client for POST /api/users
mock-server/
  server.js                  Express server entry point
  routes/users.js            User API routes
  data/seed.json             Fixed seeded users
  data/store.js              Mutable in-memory Maps and ID counter
  middleware/logger.js       Server request/status/duration logging
  logs/server.log            Current server-session log output
tests/
  ui-tests/                  Browser UI tests
  api-tests/                 Direct Playwright API tests
  assertions/                Reusable UI and API assertions
  utils/                     Test helpers, such as request tracking
utils/
  api-logger.ts              Per-test API request/response log helper
test-results/                Generated Playwright results and API logs
playwright-report/           Generated HTML report
```

See [UI test inventory](docs/ui-tests.md) and [API test inventory](docs/api-tests.md) for the current implemented test cases.

## Prerequisites

- Git
- Node.js 22 or later (the mock store imports JSON using Node's modern ES-module syntax)
- npm
- Available local port `3001` when using the local mock server

After installing npm dependencies, install the configured Playwright browsers:

```bash
npx playwright install chromium firefox
```

WebKit is intentionally not enabled in the current configuration.

## Setup

Clone the repository and check out the branch you want to run:

```bash
git clone https://github.com/amritank/floqast-assessment.git
cd floqast-assessment
git checkout dev
npm install
```

Create a local environment file from the example:

```bash
cp .env.example .env
```

For local mock execution, set `.env` to:

```dotenv
TEST_ENV=local
UI_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001
USE_MOCKS=true
```

`.env` is ignored by Git. Do not commit environment-specific values or secrets.

## Environment configuration

`config/environment.ts` loads environment values and supports these names:

| `TEST_ENV` | Intended use |
|---|---|
| `local` | Run against the bundled local mock UI and mock server. |
| `dev` | Target a configured development environment. |
| `stg` | Target a configured staging environment. |
| `prd` | Target a configured production-like environment. |

`dev`, `stg`, and `prd` are configuration labels; this repository does not provide deployed environments for them. When using one of those names, explicitly provide both `UI_BASE_URL` and `API_BASE_URL`.

`USE_MOCKS=true` tells Playwright to start `node mock-server/server.js` through `webServer`. With `USE_MOCKS=false`, Playwright does not start the local server and tests target the configured URLs instead.

## Running tests

With the local settings above, Playwright starts the mock server automatically. You do not need to start it in another terminal for normal test runs.

| Command | What it runs |
|---|---|
| `npm test` | All discovered tests in all configured projects. |
| `npm run test:chromium` | All tests in Chromium only. |
| `npm run test:uitests` | Current UI test files. |
| `npm run test:apitests` | Current direct API test files. |
| `npm test -- tests/ui-tests/create-user.spec.ts --project=chromium` | The Create User UI suite in Chromium only. |
| `npm test -- tests/api-tests/users.spec.ts --project=chromium` | The User API suite in Chromium only. |
| `npm run report` | Open the most recent HTML report. |

To run the mock application manually outside Playwright, use this direct Node command:

```bash
node mock-server/server.js
```

Then open `http://localhost:3001` in a browser. Stop the server with `Ctrl+C`.

## Results and logs

Playwright produces an HTML report and JSON results. The HTML report can be opened with:

```bash
npm run report
```

Failure screenshots and retry traces are configured in `playwright.config.ts` and appear under generated Playwright result/report folders when applicable.

| Output | Location | Notes |
|---|---|---|
| Playwright test output | `test-results/` | Per-test folders, screenshots/traces when generated, and JSON reporter output. |
| API test logs | `test-results/<test-output-folder>/api.log` | Selected direct API tests record request and response details here. Authorization headers are intentionally not logged. |
| Server log | `mock-server/logs/server.log` | Records method, URL, response status, and duration for the current mock-server session. The logger starts a fresh file when the server starts. |
| HTML report | `playwright-report/` | Open through `npm run report`. |

Generated test results and local `.env` files are ignored by Git.

## AI assistance disclosure

AI was used as a learning and pair-programming aid. It helped review test and server code, explain Playwright/TypeScript concepts, draft documentation, and provide coding guidance. The test scope, implementation decisions, and final code were reviewed and carried out by the author.

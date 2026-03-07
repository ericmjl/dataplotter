# How to run tests and lint

**Goal:** Run the test suite and lint from the command line (for CI or local checks).

## Commands

```bash
# Run all unit tests (Vitest)
npm test

# Run tests with coverage report (v8; requires @vitest/coverage-v8)
npm run test:coverage

# Run E2E tests (Cypress; start dev server first: npm run dev)
npm run test:e2e

# Open Cypress interactive runner
npm run test:e2e:open

# Lint (ESLint)
npm run lint

# Type-check and production build
npm run build
```

## What each does

- **`npm test`** — Runs Vitest in `run` mode. Test files live next to source (e.g. `*.test.ts`) or under test directories. Uses `jsdom` for React/DOM.
- **`npm run test:e2e`** — Runs Cypress E2E tests headlessly. Start the app with `npm run dev` in another terminal first (default `http://localhost:5173`). Config: `cypress.config.ts`; specs: `cypress/e2e/**/*.cy.ts`.
- **`npm run test:e2e:open`** — Opens the Cypress interactive runner to run or debug E2E specs.
- **`npm run lint`** — Runs ESLint on the project (config in `eslint.config.js`).
- **`npm run build`** — Runs `tsc -b` then `vite build`. Fails on type errors or build errors.

## For coding agents

- Before claiming “done” or “fixed,” run at least the command that’s relevant to your change (e.g. `npm test` after changing engine or lib code, `npm run build` after any TS/import change).
- Fix any new lint or type errors you introduce; don’t leave them for “later.”

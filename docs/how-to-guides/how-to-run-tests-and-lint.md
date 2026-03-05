# How to run tests and lint

**Goal:** Run the test suite and lint from the command line (for CI or local checks).

## Commands

```bash
# Run all tests (Vitest)
npm test

# Lint (ESLint)
npm run lint

# Type-check and production build
npm run build
```

## What each does

- **`npm test`** — Runs Vitest in `run` mode. Test files live next to source (e.g. `*.test.ts`) or under test directories. Uses `jsdom` for React/DOM.
- **`npm run lint`** — Runs ESLint on the project (config in `eslint.config.js`).
- **`npm run build`** — Runs `tsc -b` then `vite build`. Fails on type errors or build errors.

## For coding agents

- Before claiming “done” or “fixed,” run at least the command that’s relevant to your change (e.g. `npm test` after changing engine or lib code, `npm run build` after any TS/import change).
- Fix any new lint or type errors you introduce; don’t leave them for “later.”

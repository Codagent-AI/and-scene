# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm install
npm run dev
npm run build
```

## Verification and inspection

Browser checks use Playwright Chromium. Install it once per machine:

```bash
npm ci
npx playwright install chromium
```

```bash
npm test                 # Vitest unit and contract tests
npm run lint             # ESLint
npm run build            # TypeScript and production build
npm run verify           # build -> sample -> render gate (vite preview on 127.0.0.1); exits non-zero on failure
npm run test:e2e         # browser-backed suites: verify pass/fail (E2E-001/002) and screenshot helper (INT-002)
npm run inspect -- how-to-make-a-presentation [--settle <ms>] [--viewport WxH] [--skip-build]
```

`npm run inspect` builds, serves a production preview, and writes one settled
screenshot per step to the git-ignored `artifacts/inspection/<slug>/step-NN.png`
(plus `manifest.json`). It prints advisory `WARN` lines for unmarked text/chrome
overlap, indistinct active progress/ToC state, and unpolished attribution; warnings
never change the exit code. Mark intentional overlap with `data-presentation-allow-overlap`.

The INT-002 fixture (`src/test-fixtures/inspect-fixture/`) is registered only when
building with `VITE_INSPECT_FIXTURE=1`; it never ships in the production registry.

## Current State

This repository currently contains a minimal Vite, React, and TypeScript
scaffold plus an OpenSpec proposal for the future skill implementation.

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

## Current State

This repository currently contains a minimal Vite, React, and TypeScript
scaffold plus an OpenSpec proposal for the future skill implementation.

## Evolving-scene presentations

Install with `npm ci --include=dev` and `npx playwright install chromium`, then `npm run dev`.
The landing page lists the explicit registry in `src/presentations/index.ts`.
The reference presentation is `/how-to-make-a-presentation`.

- `npm test`: fast unit/component contracts.
- `npm run test:types`: positive and negative generic payload contracts.
- `npm run test:integration`: materialized bootstrap, screenshot diagnostics,
  production verification, and disposable fault-injection tests (Chromium required).
- `npm run lint` and `npm run build`: static and production checks.
- `npm run verify`: build and verify the normative nine-step reference sample.
- `npm run verify -- <slug>`: build and render another registered presentation.
- `npm run inspect -- <slug>`: build, capture every settled step at 1440 × 900,
  and print advisory overlap/chrome/attribution diagnostics. Add `--narrow` for
  390 × 844. Captures and report.json go under ignored `artifacts/inspection/`.

Use arrows, Space/PageDown, PageUp, horizontal swipes, or browse controls to
navigate. P switches between browse and present modes without losing position.
Interactive controls retain their own keyboard behavior.

The distributable workflow is `skills/presentation/SKILL.md`. Its bootstrap is
style-neutral: authors supply presentation-local CSS. `src/presentation-kit/`
is canonical. After kit or scaffolded script changes, run
`node scripts/sync-bootstrap.mjs` and the distribution integration check.
The materializer resolves templates relative to its installed skill and only
copies into empty targets; selective existing-app merges follow the skill's
contract-aware procedure.

Diagnostic warnings are advisory aids, not aesthetic pass/fail judgments. Review
composition separately using the skill's first/last/dense/narrow guidance. Only
intentional readable overlap subtrees may carry `data-presentation-allow-overlap`.

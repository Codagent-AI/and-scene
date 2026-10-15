# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npx playwright install chromium   # one-time: browser for verify, inspect, and browser tests
npm run dev
npm test           # Vitest unit/contract tests, then real-browser tests (needs Chromium)
npm run lint
npm run build
```

## Verification

- `npm run verify` — the deterministic gate. Phases: **build** (`npm run build`),
  **sample** (the nine-step reference sample "How to Use This Skill to Make a
  Presentation" is registered with every title/caption in order), **render**
  (`vite preview` on `127.0.0.1`, Playwright Chromium steps through every step via
  `data-step-count`/`data-step-index`, failing on console or page errors). It prints
  PASS/FAIL per phase, names the failing phase and step, and exits non-zero on failure.
  Options: `--root <dir>`, `--slug <slug>`.
- `npm run inspect -- <slug>` — writes one screenshot per step to
  `.inspect/<slug>/step-NN.png` (git-ignored) after a settle wait, and prints advisory
  warnings for overlapping text/chrome (exempt subtrees with
  `data-presentation-allow-overlap`), indistinct active progress/ToC chrome, and
  unpolished attribution. Warnings never change the exit code. Options:
  `--viewport WxH` (or `--narrow`), `--settle <ms>`, `--root <dir>`, `--skip-build`.

## Layout

- `src/presentation-kit/` — style-neutral scene kit (see its README for hooks)
- `src/presentations/` — registry and the reference sample
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` — verification tooling

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

## Presentation skill

`skills/presentation/SKILL.md` is the distributable agent skill. Install it by copying (or
symlinking) the whole `skills/presentation/` directory into your agent's skills directory, then
ask the agent to make or change a presentation. It gathers details one question at a time,
scaffolds whatever is missing (build setup, scene kit, presentation index) from
`skills/presentation/templates/bootstrap/` (at the project root, or under `presentations/` in a
monorepo), generates the presentation from `templates/presentation/`, and self-verifies with
`npm run verify` and `npm run inspect`. Helpers: `skills/presentation/scripts/detect-anchors.mjs`
and `scaffold.mjs`.

**Template-snapshot maintenance rule:** `templates/bootstrap/` holds snapshots of
`src/presentation-kit/` (byte-identical), `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`,
`src/main.tsx`, `src/Landing.tsx`, `src/RouteBoundary.tsx`, `src/routes.ts`, and the tsconfigs.
Update the snapshot whenever the kit or those files change; `npm test` fails on drift. The only
deliberate difference is `scripts/verify.config.json` (the starter's slug vs. the nine-step sample).
If `package.json` dependencies change, regenerate the bootstrap `package-lock.json`.

## Layout

- `skills/presentation/` — the agent skill, helper scripts, and scaffold templates

- `src/presentation-kit/` — style-neutral scene kit (see its README for hooks)
- `src/presentations/` — registry and the reference sample
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` — verification tooling

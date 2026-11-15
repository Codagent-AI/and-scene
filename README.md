# And Scene

Browser presentations as one evolving diagram. The reusable React kit owns
navigation, motion, fixed-canvas geometry, and semantic hooks. Each presentation
owns its appearance.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/` for the registry, or `/how-to-make-a-presentation` for the nine-step
reference. Right/Space/PageDown advance, Left/PageUp go back, horizontal swipes
navigate, and P switches between browse and present. Interactive controls retain
their own keys. Progress and section controls jump directly; navigation clamps.

```sh
npm test                       # fast Vitest unit and component contracts
npm run test:integration        # INT-001/002 and E2E-001/002; Chromium required
npm run test:all                # unit tests plus the four process/browser tests
npm run lint
npm run build
npm run verify                 # whole-app build + all nine production steps
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

Inspection writes settled screenshots and advisory diagnostics to
`.presentation-artifacts/<slug>/<width>x<height>/`. These files are ignored.
Warnings identify text collisions, indistinct active chrome, or attribution
that needs local styling. Mark only deliberately readable overlap with
`data-presentation-allow-overlap`. Warnings are not subjective quality scores.

Use [the presentation skill](skills/presentation/SKILL.md) to interview, scaffold,
create, modify, and verify. The distributable bootstrap is under its templates;
`materialize.mjs` copies it only to an empty, already-resolved target. The skill
explains partial scaffold integration, monorepo targets, and pre-write approval.

New presentations live in `src/presentations/<slug>/` with `entities.ts`, typed
`steps/`, `Talk.tsx`, and local CSS. Add an explicit lazy registry entry to
`src/presentations/index.ts`. Group adjacent states with the same Scene and
`groupKey`, and give continuing entities stable, namespaced layoutIds. Defaults
use an 880 × 380 canvas with a uniform fit transform.

Never put a presentation's colors, fonts, borders, spacing scale, or component
treatments in `src/presentation-kit/`. Style the `data-presentation-*` hooks
locally, including active navigation and the default GitHub attribution.

When changing kit or scaffolded scripts, run `node scripts/sync-bootstrap.mjs`
and retain the snapshot in the same change. INT-001 checks byte parity and
builds/renders a materialized app outside this repository. INT-002 exercises
settled captures and diagnostics with controlled fixtures; E2E-002 injects
build, sample, console, page, render, and transition failures in disposable copies.
No hosted CI is configured; the npm commands are the local verification gate.

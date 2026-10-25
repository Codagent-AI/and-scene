# And Scene

Browser presentations built as one evolving diagram. React, TypeScript, Vite and
Motion power a style-neutral scene kit; each presentation owns its CSS.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/how-to-make-a-presentation` for the nine-step reference. Use Right, Space
or PageDown to advance; Left or PageUp to go back; P to switch between browse and
present mode. Horizontal swipes and browse controls also navigate. Focused
controls keep their keyboard behavior.

```sh
npm test                 # fast Vitest unit and component contracts
npm run test:integration # INT-001, INT-002 and E2E-002; real temporary apps/browser
npm run lint
npm run build
npm run verify           # E2E-001: whole app build and every reference step
npm run verify -- <slug> # build and render another registered presentation
npm run inspect -- <slug>
```

Inspection writes settled desktop captures and advisory diagnostics under
`.artifacts/inspection/<slug>/`. Warnings do not establish aesthetic pass/fail.
Review the first, last and dense steps, plus a narrow viewport for responsive
work. Intentional readable overlap can be exempted on its smallest subtree with
`data-presentation-allow-overlap`. No screenshots or generated output are tracked.

Use [the presentation skill](skills/presentation/SKILL.md) to gather a topic and
visual direction, scaffold missing infrastructure, and create or modify a route.
It ships an unstyled bootstrap and presentation templates. The bootstrap's
`example` route is checked with `npm run verify -- example`; default verification
requires the canonical reference sample. Multiple presentations coexist through
the explicit registry in `src/presentations/index.ts`.

Kit geometry is 880 × 380, uniformly scaled within each mode. Stable hooks expose
chrome, entity identity and active state for local CSS. Continuing grouped scenes
retain their component instances; new elements can use `Appear` after layout
motion settles. Kit code must have no visual defaults or styling-framework imports.

After changing kit or shared scripts, run `node scripts/sync-templates.mjs` and
keep the snapshot byte-aligned. It updates shared infrastructure without replacing
the bootstrap's unstyled example. The integration test checks parity and installs,
builds and renders a materialized app from outside this repository. Browser suites
use `127.0.0.1` and dispose their previews and temporary files.

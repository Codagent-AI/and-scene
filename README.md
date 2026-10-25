# And Scene

Browser presentations made as one evolving diagram. React, TypeScript, Vite,
and Motion provide a fixed 880 × 380 canvas, persistent grouped scenes,
keyboard/touch navigation, and present/browse modes. Visual styling belongs to
each presentation; the reusable kit has no theme or framework dependency.

## Run

```sh
npm ci
npm run browser:install
npm run dev -- --host 127.0.0.1
```

Open `/` for the registry or `/how-to-make-a-presentation` for the nine-step
reference. Right/Space/PageDown advance; Left/PageUp go back; P toggles modes.
Controls keep their own keyboard behavior. Swipe horizontally on touch devices.

## Checks

```sh
npm test                 # fast Vitest unit, component, and contract tests
npm run test:integration  # INT-001 bootstrap; INT-002 screenshot diagnostics
npm run test:e2e          # E2E-002 injected failures in disposable copies
npm run lint
npm run build
npm run verify           # E2E-001: build + every reference step in Chromium
npm run verify -- --slug my-presentation
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

Chromium installation is explicit (`npm run browser:install`), and
`PLAYWRIGHT_BROWSERS_PATH` may select a shared browser cache. Local automation
binds, probes, and navigates using `127.0.0.1`. The verify command fails on build,
sample metadata, runtime/console errors, or stalled step transitions and stops
its preview and browser. Inspection captures settled images under
`artifacts/inspection/<slug>/<viewport>/`, with a JSON report. `--settle <ms>`
changes the default 1200ms. Warnings are advisory; review composition rather
than treating their count as a visual-quality score. No hosted CI is configured.

## Author

Use [the presentation skill](skills/presentation/SKILL.md). It gathers only
missing details, resolves standalone/monorepo/partial scaffolds, creates or
modifies a scoped presentation, and verifies the result. The full bootstrap
helper refuses non-empty targets; partial scaffolding is a preservation-aware
procedure in the skill.

A presentation owns `entities.ts`, `steps/`, `Talk.tsx`, and local CSS. Add one
explicit registry entry in `src/presentations/index.ts`. Steps sharing Scene and
groupKey retain their scene instance; namespace stable layoutIds and use
AnimatePresence for conditional departing children. Primitives expose
`data-presentation-*`, className, style, and custom data hooks. Style active
chrome through `data-presentation-active` and attribution through
`data-presentation-attribution`. Exempt only intentional readable overlaps with
a scoped `data-presentation-allow-overlap` marker.

After changing the canonical kit or scaffolded scripts, run
`node scripts/sync-bootstrap.mjs` to update the distributable snapshot. INT-001
compares inventories and bytes in both directions. Generated dependencies,
builds, screenshots, and disposable test projects are ignored.

# And Scene

Browser presentations as one evolving diagram. The reference presentation is
“How to Use This Skill to Make a Presentation” at `/how-to-make-a-presentation`.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

The explicit registry in `src/presentations/index.ts` drives the landing page and
lazy routes. Unknown routes return the landing page. Each presentation owns its
entities, step states, and visual CSS. `src/presentation-kit` owns typed scene
contracts, fixed 880 × 380 fit geometry, grouped persistence, motion, navigation,
and chrome hooks; it has no visual defaults or styling-framework dependency.

Right/Space/PageDown advance; Left/PageUp go back; P toggles browse/present mode.
Horizontal swipes navigate. Focused controls keep their own keys. Progress dots
jump to steps and section controls jump to the first step in an era. Navigation
clamps at both ends; switching modes retains the active step.

`skills/presentation/SKILL.md` is the distributable hybrid agent procedure. Its
bootstrap is self-contained, intentionally unstyled, and has an `example` route.
Template paths are relative to the skill directory. Preserve existing anchors
and presentations when integrating it into another app. Keep the canonical kit
and scripts byte-aligned with their bootstrap copies when maintaining behavior.

```sh
npm test                     # fast Vitest unit/component/contract checks
npm run test:types           # strongly typed payload compile checks
npm run test:browser         # INT-001/002 and E2E-001/002, slower isolated browser checks
npm run lint
npm run build
npm run verify               # build whole app, check all 9 reference steps in Chromium
npm run verify -- --slug example-slug   # check a different registered route
npm run inspect -- how-to-make-a-presentation
```

Verification binds and probes a production preview on `127.0.0.1`, checks public
`data-step-count`/`data-step-index` hooks, and exits non-zero with the phase and
step on failure. The browser suite also injects build, missing/malformed sample,
console, page, render, and transition faults into throwaway copies, and checks
preview cleanup. No hosted CI configuration is required.

The local inspection helper captures settled desktop steps to
`artifacts/inspection/<slug>/step-01.png` and onward. Its text-overlap, active
chrome, and attribution warnings are advisory, not visual pass/fail judgments.
Style `[data-presentation-active="true"]` and
`[data-presentation-attribution]` in presentation-owned CSS. Mark only intentional,
readable overlap subtrees with `data-presentation-allow-overlap`. Human browser
review still checks the first, last and dense steps, and a narrow viewport when
responsive-sensitive. Use `chrome-devtools-axi` for interactive inspection in this
repository. Generated images, builds, and installed dependencies are ignored.

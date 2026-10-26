# And Scene

Browser presentations as one evolving diagram. The reference presentation explains
how to make one: `/how-to-make-a-presentation`.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Use Right/Space/PageDown and Left/PageUp, horizontal swipes, progress buttons, or
section navigation. Press P or use the mode control to switch between browse and
present. Focused controls keep their own keyboard behavior. Navigation stops at
the first and last steps.

```sh
npm test                    # fast unit/component/type contracts only
npm run test:integration     # INT-001/002 and E2E-001/002, real browser and temporary apps
npm run lint
npm run build
npm run verify              # whole build + canonical nine-step production render
npm run verify -- --route how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

Inspection writes settled per-step PNGs and a report under
`artifacts/inspection/<slug>/<width>x<height>/`. Overlap, current-state and
attribution warnings are advisory: review the images, fix accidental collisions,
and mark only intentional readable overlapping subtrees with
`data-presentation-allow-overlap`. Do not commit these artifacts. Chromium must be
installed; browser-backed tests are deliberately separate from `npm test`.

The distributable skill is [skills/presentation/SKILL.md](skills/presentation/SKILL.md).
It interviews the author, reuses or bootstraps missing contracts, registers a
presentation, and verifies the result. Its bootstrap is a standalone neutral app;
resolve templates relative to the skill rather than the caller's directory.

`src/presentation-kit/` owns typed steps, grouped scene persistence, motion,
navigation, canvas fit, and semantic hooks. It has no visual defaults. Each
presentation owns its CSS and stable entity namespace. Add presentations as
folders under `src/presentations/` and explicitly register lazy imports in its
index. Keep the canonical kit and scripts byte-aligned with their bootstrap
copies when changing behavior. `verification.config.json` selects the root's
strict reference gate; a scaffold's config lists its own smoke routes.

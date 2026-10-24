# And Scene

Browser presentations built as one evolving diagram. The scene kit owns motion,
navigation, canvas geometry and accessible chrome; presentations own the visual style.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/how-to-make-a-presentation` for the nine-beat reference, or `/` for the
registry. Use Right/Space/PageDown and Left/PageUp, horizontal swipes, progress or
era controls. P switches browse/present while retaining your place. Focused
controls keep their own keyboard behavior. Navigation clamps at both ends.

## Authoring

Use [the presentation skill](skills/presentation/SKILL.md) to gather a story,
bootstrap a missing app, or modify an existing presentation. Templates resolve
relative to that skill. It supports standalone and monorepo targets and preserves
existing infrastructure. Non-empty scaffold targets require confirmation.

Each presentation lives under `src/presentations/<slug>/`: stable namespaced
entities, typed steps, `Talk.tsx`, and local CSS. Register an explicit lazy import
in `src/presentations/index.ts`. Adjacent states sharing Scene and groupKey keep
the scene mounted; use stable layoutIds and persistent React keys for continuity.
The kit exports Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear and SceneLayer.
Coordinates are authored on a default 880 × 380 canvas, uniformly scaled to fit.

Style `data-presentation-*` hooks locally, including active progress/ToC and the
bottom-right attribution. Add `data-presentation-allow-overlap` only to readable,
intentional overlap subtrees. The kit has no palette or component visual theme.

## Checks and artifacts

```sh
npm test                       # fast Vitest unit/component contracts
npm run test:integration        # isolated bootstrap, browser diagnostics and E2E faults
npm run lint
npm run build
npm run verify                 # whole-app build + canonical nine-step production check
node scripts/verify.mjs --slug your-slug
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

Browser scripts use Playwright Chromium against `vite preview` on `127.0.0.1` and
clean up their browser and server. Verification fails on build/type errors,
missing/malformed canonical sample, runtime/console errors or stalled transitions,
with phase and step context. `--skip-build` is for an already built test fixture.

Inspection writes settled per-step PNGs and `report.json` to
`.artifacts/inspections/<slug>/<width>x<height>/`. Its warnings identify suspicious
text overlap, indistinct active navigation and missing/undersized/default-looking
attribution. Warnings are advisory; artifacts support a separate visual review.
`--settle-ms` changes the default 850ms capture delay. Generated artifacts are ignored.

After changes to kit or scaffolded scripts, run `node scripts/sync-bootstrap.mjs`
to update their byte-identical bootstrap snapshot. The integration test compares
copies and builds the materialized app outside this repository. No hosted CI is
configured; npm scripts are the verification gate.

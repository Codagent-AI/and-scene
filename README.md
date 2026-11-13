# And Scene

Browser presentations as one evolving diagram, built with React, TypeScript, Vite and Motion.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/` for the registry or `/how-to-make-a-presentation` for the nine-step worked example. Use Right/Space/PageDown and Left/PageUp, swipe horizontally, or use browse controls. P toggles present/browse without losing your place. Focused controls retain their keys.

```sh
npm test
npm run lint
npm run build
npm run verify
npm run inspect -- how-to-make-a-presentation
```

Verification builds every presentation and checks the reference outline and every rendered step in Chromium against production preview on `127.0.0.1`. It fails on build, sample, browser, or transition errors and cleans up preview processes. Inspection expects an existing production build, captures settled per-step PNGs and a JSON report under `artifacts/inspection/<slug>/`, and emits advisory overlap, active-state, and attribution diagnostics. `PRESENTATION_SETTLE_MS` overrides the 850 ms capture delay. Screenshots and warnings aid review; they do not certify visual quality.

The public agent procedure is [skills/presentation/SKILL.md](skills/presentation/SKILL.md). It supports creation, scoped modification, and bootstrap from any working directory. A new presentation owns `entities.ts`, `steps/*`, `Talk.tsx`, and local CSS; add one explicit registry entry in `src/presentations/index.ts`. The kit owns behavior and canvas geometry, with no visual defaults. Style `data-presentation-*` hooks locally. Attribution defaults to the repository link; top-left branding is opt-in.

Keep non-test kit files and root browser scripts byte-aligned with `skills/presentation/templates/bootstrap/`. The bootstrap's reference stylesheet is intentionally empty. Browser-backed tests are limited to the named integration and end-to-end cases in the approved test plan; their temporary projects are cleaned up automatically. Set `EVIDENCE_DIR` to retain detailed subprocess logs elsewhere.

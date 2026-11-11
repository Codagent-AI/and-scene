# And Scene

Browser presentations as one evolving diagram. The reference presentation explains the workflow through nine cumulative beats at `/how-to-make-a-presentation`.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/` for the registry. Right / Space / PageDown advances, Left / PageUp goes back, P switches browse/present mode, and horizontal touch swipes navigate. Focused controls keep their native keys. Browse mode provides captions, progress controls, and sections on wide screens. Navigation clamps at both ends.

## Create or modify a presentation

Use [the presentation skill](skills/presentation/SKILL.md). Its distributable bootstrap is relative to that file, under `templates/bootstrap/`; the reusable starter is under `templates/presentation/`. The skill asks one question at a time and accepts explicit partial-detail input. It detects compatible infrastructure by contract, preserves existing anchors and presentations, resolves monorepo apps under `presentations/`, and confirms non-empty scaffold targets before writing.

Each presentation owns an `entities.ts` identity namespace, typed `steps/`, a `Talk.tsx` entry, and its own CSS. Register it explicitly in `src/presentations/index.ts`. Continuing entities retain their `layoutId`; adjacent states share a `groupKey` and Scene component to update payload without remounting. `Appear` delays newcomers until layout motion settles; place entrants under `AnimatePresence` for exits. The default canvas is 880 × 380 and scales uniformly.

`src/presentation-kit/` owns behavior, geometry, and stable `data-presentation-*` hooks. It supplies no visual theme. Style nodes, active progress/contents states, and attribution in presentation or host CSS. The bootstrap's example deliberately has no presentation styling.

## Verification

```sh
npm test                    # fast Vitest unit and component contracts
npm run test:integration    # INT-001, INT-002, E2E-001, E2E-002; real Chromium
npm run lint
npm run build
npm run verify              # build and verify all nine reference steps
npm run verify -- my-slug   # build and verify every step of another registered route
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation 390 844
```

Verification builds the entire app, serves production output on `127.0.0.1`, advances through public count/index hooks, rejects reference metadata drift, and fails on console errors, uncaught exceptions, and stalled transitions. Errors identify phase and step. Preview and browser resources are closed on completion or failure. Integration tests materialize the bootstrap and faulted copies in disposable directories; they leave source files unchanged.

Inspection captures settled screenshots and a manifest under `artifacts/inspection/<slug>/<width>x<height>/`. It reports advisory overlaps, indistinct active chrome, and missing/default/small attribution. Review the first, last, dense/key, and responsive-sensitive views. An explicit `data-presentation-allow-overlap` subtree suppresses internal overlap diagnostics only; use it only for intentional readable compositions. These artifacts support visual review and do not establish automated visual pass/fail.

Keep kit files and root scripts byte-aligned with bootstrap copies when editing. Do not commit dependencies, build output, or inspection artifacts. There is no hosted CI or export/publishing workflow.

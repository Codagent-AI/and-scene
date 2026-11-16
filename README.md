# And Scene

A small Vite, React, and TypeScript application for presentations that evolve as
one diagram. Open `/how-to-make-a-presentation` for the nine-beat reference scene.

```sh
npm ci
npx playwright install chromium  # once, if Chromium is not installed
npm run dev -- --host 127.0.0.1
```

Use Right/Space/PageDown and Left/PageUp, horizontal touch swipes, progress
controls, or the wide-screen table of contents to navigate. P toggles browse and
present modes without losing your place. Focused controls keep their own keys.

```sh
npm test                     # fast unit/component and TypeScript contracts
npm run test:integration      # INT-001, INT-002, E2E-001, E2E-002; real Chromium
npm run lint
npm run build
npm run verify               # build + all nine production reference steps
npm run verify -- --slug your-slug --first
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

`inspect` builds and serves production output on `127.0.0.1`, captures settled
steps, and writes `artifacts/inspection/<slug>/<width>x<height>/step-XX.png` and
`report.json`. Collision, current-state, and attribution warnings are advisory.
Use `data-presentation-allow-overlap` only on intentional readable compositions.
Do not commit screenshots, build output, or dependencies.

The distributable agent procedure is [skills/presentation/SKILL.md](skills/presentation/SKILL.md).
Its bootstrap snapshot includes the build, a style-neutral kit, an explicit
registry/router, and an unstyled example. Full-copy materialization refuses to
overwrite non-empty targets. Partial projects are merged by the skill procedure
without replacing existing anchors. Monorepos use a self-contained `presentations/`
app; standalone projects use the root.

Each presentation owns `entities.ts`, typed `steps/`, `Talk.tsx`, and its plain CSS.
The kit owns navigation, layout geometry, identity, and motion only. Consecutive
steps with the same `Scene` and `groupKey` retain the scene instance; persistent
entity IDs keep layout continuity. A new presentation needs one explicit registry
entry in `src/presentations/index.ts`.

After changing kit or browser scripts, run `node scripts/sync-bootstrap.mjs` to
refresh the distributable snapshot. INT-001 checks byte parity and materializes
it outside the source app before building and rendering. Browser-backed tests
share dependencies/build setup where possible, run serially, and clean disposable
copies and preview processes. Set `EVIDENCE_DIR` to retain their command logs.

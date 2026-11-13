# And Scene

Browser presentations built as one evolving diagram, using React, TypeScript,
Vite and Motion. Each presentation owns its visual style; the shared scene kit
provides behavior, geometry and stable DOM hooks.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/` for the index or `/how-to-make-a-presentation` for the nine-step reference.
Use Right/Space/PageDown and Left/PageUp, touch swipes, or browse controls. Press
P to switch modes. Interactive controls retain their own keyboard handling.

The distributable workflow is [skills/presentation/SKILL.md](skills/presentation/SKILL.md).
Its bootstrap is unstyled and self-contained; presentation templates live beside
it. Resolve them relative to the skill directory, not the target working directory.
Register new folders explicitly in `src/presentations/index.ts`.

```sh
npm test                       # unit, component and typed-payload contracts
npm run test:integration        # INT-001/002 and E2E-001/002; production browsers
npm run lint
npm run build
npm run verify                 # build plus canonical sample verification
npm run verify -- --presentation my-slug
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

The browser integration suite uses disposable app copies, and injects build,
metadata, console, page, render and transition faults. Verification exits nonzero
on errors and shuts down its preview/browser. Preview hosts and URLs use IPv4
loopback consistently.

The inspection helper expects a production build and captures all settled steps
under `artifacts/inspection/<slug>/<width>x<height>/` with a JSON report. It warns
about text/chrome overlap, indistinct active navigation and unpolished attribution.
Warnings are advisory; review first, last and dense/key steps, plus narrow views
for responsive-sensitive presentations. Mark only intentional readable overlaps
with `data-presentation-allow-overlap` on the relevant subtree.

Keep `src/presentation-kit/` and the bootstrap copy byte-aligned, and root/helper
scripts aligned with their template copies. Keep generated output, dependencies,
and screenshots uncommitted. No hosted CI, publishing or export workflow is included.

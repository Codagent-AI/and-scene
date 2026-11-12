# And Scene

Browser presentations as one evolving diagram. The reference presentation at
`/how-to-make-a-presentation` explains the skill with nine accumulating scene states.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Use arrows, Space, PageDown/PageUp, horizontal swipes, progress controls or the
wide-screen table of contents to navigate. P switches between browse and present
modes without changing position. Focused controls retain their own key behavior.

```sh
npm test                 # fast Vitest unit/component/contract checks
npm run test:browser     # INT-001, INT-002, E2E-001, E2E-002; slower isolated copies
npm run lint
npm run build
npm run verify           # build + all nine canonical steps in production Chromium
npm run verify -- slug   # build + all steps of another registered presentation
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width=390 --height=844
```

Inspection writes settled screenshots and a JSON warning report under
`artifacts/inspect/<slug>/<width>x<height>/`. Warnings are advisory: review overlap,
active navigation and attribution warnings and fix accidental defects. Only
intentionally readable overlap should use `data-presentation-allow-overlap`.
Artifacts, dependencies and builds are ignored by Git.

The portable skill is [skills/presentation/SKILL.md](skills/presentation/SKILL.md).
Its bootstrap template is a self-contained, visually unstyled React/Vite app;
template paths resolve beside the installed skill. Preview scaffold targets with
`node <skill-directory>/tools/scaffold.mjs <target>`. Follow the skill's semantic
anchor inspection and non-empty-target confirmation before copying. Monorepos
receive a self-contained `presentations/` app. Existing app anchors are preserved.

The canonical kit lives in `src/presentation-kit/`. Keep its non-test files and
all verification/inspection scripts byte-aligned with the bootstrap copies.
Presentations own visual CSS; the reusable kit owns motion, geometry and behavior
only. Register presentations explicitly in `src/presentations/index.ts`.

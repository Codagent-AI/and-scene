# and-scene

Browser presentations built as one evolving diagram. The React scene kit provides
stable entity motion, typed grouped scenes, a fixed 880 × 380 canvas, and
present/browse navigation. Presentations own their appearance in local CSS.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/how-to-make-a-presentation` for the nine-beat reference presentation. The
landing page lists the explicit registry in `src/presentations/index.ts`.
ArrowRight, Space, and PageDown advance; ArrowLeft and PageUp go back. P switches
modes without losing position. Browse mode also provides progress/section jumps
and previous/next buttons. Horizontal touch swipes navigate without wrapping.
Focused interactive controls retain their keys.

The distributable [presentation skill](skills/presentation/SKILL.md) includes
neutral bootstrap templates and authoring examples. Its helper plans the target
before copying only missing infrastructure; see the skill for contract detection,
monorepo handling, dependency installation, and preservation of existing apps.

```sh
npm test                         # fast Vitest unit and component contracts
npm run test:integration          # filesystem + production Chromium tests
npm run lint
npm run build
npm run verify                   # build + strict canonical nine-step gate
npm run verify -- --slug example  # build + all-step check of another route
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

Verification uses `vite preview` and Playwright Chromium on `127.0.0.1`, fails on
build, reference metadata, browser errors, or stalled transitions, and cleans up
the preview. Inspection saves settled PNGs and a manifest under
`artifacts/inspection/<slug>/<width>x<height>/`. Overlap, active-navigation, and
attribution warnings are advisory; screenshots require visual review. Mark a
readable intentional overlap with `data-presentation-allow-overlap` only on the
relevant subtree.

The bootstrap kit and scripts are release snapshots. Keep
`src/presentation-kit/` and `scripts/*.mjs` byte-aligned with their copies under
`skills/presentation/templates/bootstrap/`; INT-001 checks parity. Generated
builds, installed dependencies, and inspection artifacts are ignored. No hosting,
publishing, or export pipeline is included.

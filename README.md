# And Scene

Browser presentations as one evolving diagram. The scene kit provides typed
steps, stable motion identities, navigation, present/browse modes, and a fixed
880 × 380 canvas. Presentations own all visual styling.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
npm test                 # fast Vitest unit/contracts
npm run test:integration # isolated bootstrap/helper and verification-fault tests
npm run lint
npm run build
npm run verify           # build + canonical nine-step production browser gate
npm run inspect -- how-to-make-a-presentation
```

The sample is at `/how-to-make-a-presentation`; `/` lists the explicit registry.
Keyboard: Right/Space/PageDown next, Left/PageUp previous, P toggles mode. Focused
controls keep their keys. Swipe horizontally or use browse progress/section
controls. Navigation clamps at both ends.

Use `skills/presentation/SKILL.md` to create or modify presentations. Copy bootstrap
assets relative to that skill's directory. `src/presentation-kit/` is canonical;
keep its non-test files and scripts byte-aligned with the bootstrap snapshot.
The bootstrap starter is intentionally unstyled and its verify script targets
`starter`; authored presentations supply their own CSS and default verify route.

Inspection writes settled desktop screenshots and advisory reports under
`artifacts/inspection/<slug>/`. Warnings are review aids, not visual acceptance.
Use `data-presentation-allow-overlap` only for intentional readable overlap.
Generated screenshots, builds, and dependency directories are ignored.

# And Scene

Browser presentations as one evolving diagram. The reference presentation is at
`/how-to-make-a-presentation`; `/` lists the explicit registry.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Use [the presentation skill](skills/presentation/SKILL.md) to create or modify a
presentation. It resolves templates relative to its own directory, gathers
content interactively, and can bootstrap standalone or monorepo targets.

The canonical kit is `src/presentation-kit/`. It supplies typed steps, persistent
grouped scenes, Motion layout identities, navigation, chrome, and an 880 × 380
fit-scaled canvas. It supplies no visual theme. Each presentation owns its CSS,
including active navigation and attribution treatments. All nine sample beats
share one scene group; stable entity positions accumulate without rearrangement.

Keyboard: Right / Space / PageDown advance; Left / PageUp go back; P toggles
browse/present mode. Focused controls retain their keys. Horizontal swipes also
navigate; boundaries clamp. Browse mode has captions and progress controls, with
section navigation on wide viewports.

```sh
npm test                          # fast Vitest component/unit contracts
npm run test:integration           # INT-001/002 and E2E-001/002, Chromium required
npm run lint
npm run build
npm run verify                    # whole-app build and all nine reference steps
node scripts/verify.mjs --slug <slug> --first
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390
```

The inspection helper writes settled per-step PNGs and a JSON diagnostic report
under `.presentation-artifacts/<slug>/<width>x<height>/`. Warnings identify
unmarked text overlap, indistinct active chrome, and attribution defects. They
are advisory review aids, not visual-quality approval. Mark only intentional,
readable overlap subtrees with `data-presentation-allow-overlap`.

Bootstrap contains an unstyled example, a committed dependency lock, and the
same kit and browser scripts. When editing shared behavior, update its snapshot
in `skills/presentation/templates/bootstrap/`; do not commit dependencies,
production output, test work directories, or inspection images. There is no
hosted CI configuration; npm scripts are the local verification gates.

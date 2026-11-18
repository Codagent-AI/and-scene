# And Scene

Browser presentations as one evolving diagram. React 19, TypeScript, Vite and
Motion, with a style-neutral scene kit and a distributable agent skill.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/` for the registry or `/how-to-make-a-presentation` for the nine-step
reference. Right / Space / PageDown advance; Left / PageUp go back; P switches
browse/present mode. Horizontal swipes, progress controls and section navigation
are supported. Focused controls keep their own keys.

```sh
npm test                          # fast unit/component contracts
npx tsc -p tests/tsconfig.json     # typed payload boundary fixture
npm run test:integration           # INT-001/002, E2E-001/002; real Chromium
npm run test:all                   # unit and integration gate
npm run lint
npm run build
npm run verify                    # builds app, validates/renders all nine reference steps
npm run verify -- --slug my-story  # builds app and renders a registered target
npm run inspect -- how-to-make-a-presentation
```

The inspection helper writes settled 1440 × 900 screenshots to
`artifacts/inspection/<slug>/step-NN.png`. Warnings about overlap, active chrome,
and attribution are advisory, not visual-quality pass/fail scores. Mark only
intentional readable overlap with `data-presentation-allow-overlap` on the
relevant subtree. Generated images and dependency/build output are ignored.
Browser scripts bind, probe and navigate using `127.0.0.1` and clean up previews.
Integration fault tests use throwaway directories and never mutate the source.
Set `TEST_CASE=INT-002` (or another named case) to run one integration case.

Use [the presentation skill](skills/presentation/SKILL.md) to create or modify
presentations. Templates resolve from its own directory, include the complete
locked dependency set, and bootstrap standalone or monorepo targets. Creation
adds a presentation-local folder plus an explicit registry entry; existing
presentations coexist. The unstyled bootstrap starter is intentionally plain.

The kit owns identity, motion, fixed 880 × 380 canvas geometry, navigation and
semantic `data-presentation-*` hooks. Presentations own CSS. Typed grouped steps
share a Scene and groupKey so payload changes preserve the mounted instance.
Keep canonical `src/presentation-kit/` byte-aligned with the bootstrap copy and
root scripts byte-aligned with bootstrap scripts. INT-001 guards both copies.

# And Scene

A browser presentation is one evolving diagram, rendered through named steps.
The reference presentation lives at `/how-to-make-a-presentation` and explains
the public presentation skill by demonstrating its output.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

The explicit registry in `src/presentations/index.ts` supplies the landing page
and lazy presentation routes. Each presentation owns its entities, steps, and
CSS; `src/presentation-kit/` supplies typed scene contracts, layout morphs,
keyboard/touch navigation, browse/present chrome, and an 880 × 380 scaled canvas.
Right/Space/PageDown advance, Left/PageUp go back, and P toggles modes. Focused
controls keep their keys. Navigation clamps at either end.

The distributable procedure is [skills/presentation/SKILL.md](skills/presentation/SKILL.md).
Its bootstrap snapshot includes a neutral starter route, local verification and
inspection scripts, and locked dependencies. The scaffold helper resolves its
own templates independently of caller working directory, preserves existing
files, and requires target confirmation before non-empty scaffold writes.

```sh
npm test                  # fast unit/component contracts
npm run test:browser      # named integration and production failure tests
npm run lint
npm run build
npm run verify            # whole-app build and all nine canonical sample steps
node scripts/verify.mjs --slug another-presentation
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

Browser scripts use production previews on `127.0.0.1` and clean up their browser
and preview processes. Inspection writes settled per-step PNGs and diagnostics
under `artifacts/inspection/<slug>/<width>x<height>/`. Overlap, active-control, and
attribution warnings are advisory; they require composition review rather than
serving as an automatic visual-quality verdict. Intentional readable overlap may
be marked with `data-presentation-allow-overlap` on its containing subtree.

Keep canonical kit files and all scaffolded scripts byte-aligned with their
bootstrap copies when editing them. `npm run test:browser` checks distribution
materialization and parity. No hosted CI configuration is required.

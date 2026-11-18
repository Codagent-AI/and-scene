# And Scene

A browser presentation is one diagram evolving through named steps. The reference
presentation lives at `/how-to-make-a-presentation`; `/` lists the explicit registry.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

`npm test` runs fast Vitest unit/component/contract tests. `npm run test:integration`
runs the approved materialized-bootstrap, screenshot-helper and production/fault
verification tests in disposable directories. `npm run lint` and `npm run build`
check the source. `npm run verify` builds the entire app and checks all nine
reference steps in production Chromium. Browser automation uses IPv4 loopback.

```sh
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

Inspection writes settled PNGs and `report.json` beneath
`artifacts/inspection/<slug>/<width>x<height>/`. Warnings are advisory, not a visual
quality verdict. Use `data-presentation-allow-overlap` only on intentional readable
overlapping subtrees. Screenshots, builds and dependencies are ignored by git.

The distributable procedure is [skills/presentation/SKILL.md](skills/presentation/SKILL.md).
It carries bootstrap and presentation templates and a non-overwriting scaffold
utility. Templates resolve relative to the skill. Run `node scripts/sync-templates.mjs`
after modifying the canonical kit or shared verification/inspection scripts;
INT-001 enforces byte parity. The bootstrap's `example` route is intentionally
unstyled; presentations own all visual choices. No CSS framework is required.

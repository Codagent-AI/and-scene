# And Scene

Browser presentations as one evolving diagram. Start the app with `npm ci` and
`npm run dev`, then open the printed URL. The landing page lists presentations;
the reference lives at `/how-to-make-a-presentation`.

Use Right / Space / PageDown and Left / PageUp, swipe horizontally, or choose a
step/section in browse mode. P toggles present/browse without losing your place.

`skills/presentation/SKILL.md` is the distributable creation/modification procedure.
It includes skill-relative bootstrap and presentation templates. The scene kit
owns geometry and behavior; each presentation owns its visual CSS. After changing
the kit or browser scripts, run `node scripts/sync-templates.mjs`.

Checks:

```sh
npm ci
npx playwright install chromium
npm test                         # fast unit/component contracts
npx tsc -p tsconfig.contract.json # typed public boundary
npm run test:integration          # INT-001/002 and E2E-001/002; real builds/browser
npm run lint
npm run build
npm run verify                   # canonical nine-step production gate
npm run inspect -- how-to-make-a-presentation
```

Verification builds the whole application, checks the canonical sample, opens a
Chromium production preview on 127.0.0.1, and enumerates every public step index.
It exits nonzero on build, sample, console/page, or transition failure and cleans
up the preview. Bootstrap apps select their own sample with
`presentation.config.json` (`slug` and `reference: false`).

Inspection writes settled desktop screenshots to
`.presentation-artifacts/<slug>/NN.png`. Overlap, indistinct active navigation,
and attribution findings are advisory, not an automatic aesthetic score. Mark
only an intentional, readable overlap subtree with
`data-presentation-allow-overlap`. Generated screenshots, builds, and dependencies
are ignored. Acceptance review checks first, last, dense, and narrow compositions.

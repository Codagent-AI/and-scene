# And Scene

Browser presentations as one evolving diagram. The React kit owns scene identity,
motion, navigation, chrome behavior and fixed-canvas fit scaling. Each presentation
owns its visual design in local CSS. No styling framework is required.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/` for the explicit registry or `/how-to-make-a-presentation` for the
nine-step reference. Right/Space/PageDown advance, Left/PageUp go back, P switches
browse/present mode; horizontal swipes and browse controls also navigate. Focused
controls keep their keys. Navigation clamps at the ends.

```sh
npm test                  # fast Vitest unit/component/type contracts
npm run test:integration  # INT-001/002 and E2E-001/002, real builds and Chromium
npm run lint
npm run build
npm run verify            # whole build and all reference steps in Chromium
npm run verify -- --slug your-slug
npm run inspect -- how-to-make-a-presentation
```

Inspection writes settled desktop screenshots and `report.json` to
`artifacts/inspection/<slug>/` (gitignored). `--settle <ms>` configures the default
850ms settle interval; `--output <path>` changes the artifact destination. Warnings
for text collisions, indistinct active controls and attribution are advisory,
not automated visual-quality failures. Mark only intentional readable overlap
subtrees with `data-presentation-allow-overlap`. The helper never replaces visual
review of first, last, dense/key and responsive narrow compositions.

The distributable skill lives in `skills/presentation/SKILL.md`. Its templates
resolve relative to that file. `templates/bootstrap/` is a complete neutral app,
including lockfile, kit, lint/build setup and local browser scripts; its example
route deliberately has no visual theme. `templates/presentation/` supplies a
minimal typed grouped-scene example. Copy the bootstrap only for missing anchors;
preserve existing app contracts and dependencies. Monorepos get a self-contained
`presentations/` app after the skill's target-confirmation step.

Add presentations as `src/presentations/<slug>/Talk.tsx`, entity IDs, typed steps,
and local CSS, plus one explicit lazy registry entry in
`src/presentations/index.ts`. Keep entity IDs stable across steps. Shared groupKey
and Scene preserve the instance while payload changes. Newcomers wait for layout
motion; departures use AnimatePresence. Do not add visual defaults to the kit.

Canonical `src/presentation-kit/` and its bootstrap copy must be byte-aligned.
Keep all scripts under `scripts/` aligned with bootstrap copies too. INT-001
checks both snapshots in an independently installed/materialized app. Browser
failure tests inject faults only into throwaway copies and assert preview cleanup.
No build output, dependencies, screenshots or hosted CI configuration belong in git.

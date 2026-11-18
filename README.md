# And Scene

Browser presentations as one evolving diagram. Start with:

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

The index links to **How to Use This Skill to Make a Presentation** at
`/how-to-make-a-presentation`. Arrow keys, Space, PageUp/PageDown, horizontal
swipes, and browse controls navigate; P switches browse/present modes. Focused
controls retain their keyboard behavior. Navigation clamps at both ends.

Use [the presentation skill](skills/presentation/SKILL.md) to create or modify a
presentation. Its templates are distributable, including a complete unstyled
bootstrap, lockfile, scene kit, and local browser scripts. Add a folder under
`src/presentations/` and an explicit lazy registration to `index.ts`. Each
presentation owns its CSS; the kit owns only behavior, geometry, and stable
`data-presentation-*` hooks. Adjacent steps sharing a Scene and groupKey preserve
the Scene instance and update typed payloads. Wrap conditional entities in
AnimatePresence for exit animations.

## Checks

```sh
npm test                         # fast Vitest contracts/components
npm run test:integration          # INT-001/002 and E2E-001/002; real Chromium
npm run lint
npm run build
npm run verify                   # production build and all nine sample steps
npm run inspect -- how-to-make-a-presentation
```

The integration suite shares installed dependencies across disposable fault
copies. Bootstrap materialization installs its own locked dependencies. Test
fixtures, logs, and inspection output are ignored. Preview processes and browsers
are stopped on success or failure. No hosted CI is configured.

The bootstrap's `npm run verify` checks every registered presentation via
`--registered`, including user routes after removing the starter. Its landing
links expose `data-presentation-route` for deterministic discovery. Resolve
distributed templates with `node <skill-directory>/templates.mjs bootstrap`
from any working directory.

For a new route use `node scripts/verify.mjs --route <slug>`; `--first` is a lighter
first-step smoke check. The default verification validates the reference sample's
normative eras, titles, and captions as well as runtime behavior. Every check
uses `127.0.0.1` for preview, readiness, and browser navigation.

Inspection captures settled steps under
`artifacts/inspection/<slug>/<width>x<height>/`, with a JSON report. Use
`--width 390 --height 844` for narrow captures or `--settle 1200` for longer
custom animations. Overlap, active-state, and attribution diagnostics are
advisory; captures do not establish a visual-quality pass. Mark only intentional
readable overlap with `data-presentation-allow-overlap` on a minimal subtree.

Keep canonical kit files and bootstrap kit files byte-identical. Keep all files
in root `scripts/` aligned with bootstrap copies. The bootstrap's unstyled starter
route is deliberately separate from the designed reference sample. Do not commit
node_modules, builds, or screenshots.

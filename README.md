# And Scene

And Scene builds browser presentations as one evolving diagram: stable entities
appear, move, connect and change across named steps. The committed example is
[How to Use This Skill to Make a Presentation](src/presentations/how-to-make-a-presentation/Talk.tsx).

The distributable [presentation skill](skills/presentation/SKILL.md) interviews
for a topic, visual direction and story beats, or modifies one identified
presentation. It carries a style-neutral bootstrap, scene kit, presentation
starter and deterministic scaffolder. Templates resolve relative to the skill,
so it works outside this checkout. Standalone projects use their root; monorepos
receive a self-contained `presentations/` app. Existing infrastructure is reused,
missing anchors are added without overwriting host files, and build-only hosts
retain their root content alongside new presentation routes.

The canonical [scene kit](src/presentation-kit/index.ts) owns typed steps, grouped
scene persistence, entity motion, navigation, browse/present chrome and fixed
880×380 canvas scaling. Each presentation owns its entities and CSS. Register a
new folder with one explicit slug/title/lazy-loader entry in
[src/presentations/index.ts](src/presentations/index.ts).

## Development and verification

```bash
npm ci
npx playwright install chromium # once, when the browser is missing
npm run dev
npm test                       # fast unit and template/scaffold contracts
npm run lint                   # ESLint
npm run build                  # TypeScript + production build
npm run verify                 # build and render every registered step
npm run verify -- how-to-make-a-presentation
npm run test:integration        # materialized bootstrap, partial host, browser diagnostics/failures
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --viewport 390x844
```

The root expectations file additionally checks the reference's nine normative
titles and captions. Fresh bootstrap apps omit those sample expectations and
verify only their own registered presentations. The npm scripts are the project
verification gate; no hosted CI configuration is required.

## Inspect composition

The project-local helper captures each settled step from a production preview on
`127.0.0.1`. Desktop defaults to 1440×900 with an 850 ms settle interval.
Screenshots live in `artifacts/inspect/<slug>/<viewport>/step-01.png` and subsequent
step files; `report.json` records index, ID, screenshot, warnings and entity
opacity. Generated output and inspection artifacts are gitignored.

Optional arguments: `--viewport WxH`, `--settle <milliseconds>`, `--out <directory>`
and `--no-build`. Operational errors exit non-zero. Advisory `WARN` lines identify
text/chrome overlap, indistinct active navigation or unpolished attribution.
Review first, last and dense/key screenshots and narrow responsive views. Fix
accidental collisions and polish in presentation-owned CSS; mark only intentional
readable overlap with `data-presentation-allow-overlap`. Report any reviewed
remaining warnings accurately. Inspection supplements `npm run verify`.

For interactive inspection use `chrome-devtools-axi`: open the production route,
start with `snapshot`, then capture screenshots. Verification and inspection
scripts clean up their preview and browser processes on success or failure.

When updating the kit or browser tooling, update the bootstrap copies too; the
fast parity contracts enforce identical files and bytes, matching dependency
ranges, and the absence of styling-framework defaults.

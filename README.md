# And Scene

Browser presentations as one evolving diagram. React 19, TypeScript, Vite, and Motion provide the runtime; each presentation owns its visual design in plain CSS.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/how-to-make-a-presentation` for the nine-step reference presentation. Use Right/Space/PageDown and Left/PageUp, horizontal swipe, or browse controls to navigate. P toggles present/browse without changing position. Focused controls keep their own keys.

## Authoring

The distributable procedure is [skills/presentation/SKILL.md](skills/presentation/SKILL.md). It gathers the topic, style, and step details; resolves standalone/monorepo scaffolding; creates or modifies a presentation; then verifies it. Templates resolve relative to the skill directory, not the caller's cwd.

A presentation lives under `src/presentations/<slug>/` with `entities.ts`, `steps/`, `Talk.tsx`, and local CSS. Add one explicit registry entry in `src/presentations/index.ts`. Import behavior and primitives from `src/presentation-kit/`; do not put visual defaults there. Typed `Step<T>` arrays pass directly to `Presentation`. Adjacent steps sharing both `groupKey` and `Scene` retain the mounted scene instance. Keep continuing entities outside newcomer fade wrappers. Use stable namespaced layoutIds, and let only newcomers enter after the layout transition.

The optional repository helper `node scripts/scaffold.mjs <existing-directory> --anchors=build --confirmed` copies missing anchors without overwriting existing files. Inspect the contracts yourself and pass the anchors actually present (`build,kit,index`); it deliberately does not guess from file names. It reports the target and refuses non-empty unconfirmed writes. For partial existing apps, integrate new anchors with their existing router/build and install the merged dependencies. In monorepos, a root build anchor is preserved while a complete child app is created in `presentations/`.

## Checks

- `npm test`: fast unit/component/type-contract-related tests.
- `npm run test:integration`: INT-001, INT-002, E2E-001, and E2E-002, using disposable local copies. Chromium must be installed. Fixtures and subprocesses are cleaned up.
- `npm run lint`: ESLint.
- `npm run build`: whole-app TypeScript and production build, including the compiled typed boundary fixture.
- `npm run verify`: build plus production Chromium render of all nine normative sample steps; errors report phase and step and exit non-zero.
- `node scripts/verify.mjs --slug=<slug>`: build and render every step of another presentation; add `--first-only` for a first-step smoke check.
- `npm run inspect -- <slug>`: build, capture every settled step, and write `artifacts/inspection/<slug>/<width>x<height>/step-NN.png` plus `report.json`. Overlap, active-navigation, and attribution warnings are advisory. Review images separately; diagnostics do not certify visual quality.

All preview hosts, probes, and browser URLs use `127.0.0.1`. The inspection module exports `inspect({slug, viewport:{width:390,height:844}})` for responsive captures. Intentional readable overlap can be marked on a subtree with `data-presentation-allow-overlap`; do not blanket-exempt accidental collisions. Style current-state hooks and `data-presentation-attribution` locally.

The kit and browser scripts are release snapshots in `skills/presentation/templates/bootstrap/`. Keep their canonical and template copies byte-aligned when changing them. Do not commit generated builds, dependencies, fixture directories, or screenshots. This repository uses npm checks as its verification gate and has no hosted CI configuration.

Use `npm run inspect -- <slug> --viewport=390x844` for narrow captures; each viewport has a separate directory so wide captures remain available. Add `--no-build` to reuse a production build.

# And Scene

Browser presentations built as one evolving React scene. The reference at
`/how-to-make-a-presentation` explains the authoring workflow in nine beats.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/` for the explicit presentation registry. Arrow keys, Space, PageUp and
PageDown navigate; horizontal swipes work on touch devices. `P` toggles reading
and live presentation modes. Focused controls keep their own keyboard behavior.

```sh
npm test                 # fast Vitest unit/component/contract and type checks
npm run test:integration # INT-001/002 and E2E-001/002; real filesystem/browser
npm run lint
npm run build
npm run verify           # build and every reference step in Chromium
npm run inspect -- how-to-make-a-presentation
```

The inspection helper writes settled screenshots and `report.json` under
`artifacts/inspection/<slug>/`. Overlap, current-navigation, and attribution
warnings are advisory; screenshots require a separate visual review. Intentional
readable overlap can be marked on a narrow subtree with
`data-presentation-allow-overlap`.

`skills/presentation/SKILL.md` is the distributable authoring workflow. It gathers
requirements, resolves standalone/monorepo targets, scaffolds missing contracts,
authors or modifies a presentation, and verifies it. Its `scaffold.mjs` resolves
templates from its own location and preserves existing files; review and merge
existing entry points when integrating a partial scaffold. Non-empty missing
infrastructure requires confirmed target selection before writes.

The kit in `src/presentation-kit/` supplies typed steps, grouped persistent scenes,
fixed 880 × 380 canvas scaling, motion, navigation, and stable DOM hooks. Visual
styles belong to each presentation or its host. No styling framework is required.
New presentations live under `src/presentations/<slug>/` and get an explicit lazy
registry entry in `src/presentations/index.ts`.

Keep non-test kit files and production scripts byte-identical to
`skills/presentation/templates/bootstrap/`. The bootstrap contains an unstyled
starter route; its local verify command checks that route. The root verify command
checks the normative nine-step reference. `--presentation <slug>` selects another
registered route. Integration tests enforce template parity and exercise the
materialized app outside this repository. Generated files, dependencies, and
screenshots are ignored; there is no hosted CI configuration.

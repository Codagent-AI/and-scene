# And Scene

Browser presentations as one evolving diagram. Stable entities accumulate and
morph through named beats, with captions for reading and a quiet present mode.

## Run

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/` for the registry, or `/how-to-make-a-presentation` for the nine-beat
field guide. Arrow keys, Space and PageDown advance; Left and PageUp retreat.
P toggles browse/present without changing your place. Touch swipes and browse
controls provide the same navigation; progress and section controls jump directly.

## Create or modify

Use [`skills/presentation/SKILL.md`](skills/presentation/SKILL.md). The skill
collects topic, style and beats, resolves standalone/monorepo scaffolding, and
creates a folder under `src/presentations/`. Add one explicit entry to
`src/presentations/index.ts`. Each presentation owns its CSS; the reusable kit
has no theme or styling-framework dependency. See the committed field guide and
`skills/presentation/templates/presentation/` for typed grouped scenes.

The distributable `templates/bootstrap/` includes a deliberately unstyled example,
all dependencies and a lockfile. Resolve its path from the skill's own directory.
Its `npm run verify` checks `example`; this repository's default checks the exact
reference outline. For other work use `node scripts/verify.mjs --slug <slug>`.
Verification always builds the whole app, serves a production preview on IPv4,
checks every step and fails on browser/console/transition errors.

## Checks and inspection artifacts

```sh
npm test                    # fast Vitest unit/component/contract tests
npm run test:browser         # INT-001, INT-002, E2E-001, E2E-002; Chromium required
npm run lint
npm run build
npm run verify
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390
```

Inspection builds by default. Pass `--no-build` only when the current production
build is already fresh. The local helper writes settled per-step PNG files and
`report.json` to `.artifacts/inspection/<slug>/<viewport>/`. Warnings name
suspicious text/chrome overlaps, indistinct active navigation, and missing,
small or browser-default attribution. They are advisory, not a visual-quality
gate. Only intentional readable overlaps should use
`data-presentation-allow-overlap` on their smallest enclosing subtree.

The kit exposes `data-presentation-*` hooks plus `data-step-count` and
`data-step-index`. Active controls have `aria-current="step"` and
`data-presentation-active="true"`. Style these and the bottom-right
`data-presentation-attribution` link in presentation-owned CSS. Host branding is
opt-in. The default fixed canvas is 880 × 380; optional canvas dimensions belong
to the Presentation props, and fit scaling never reflows diagram coordinates.

After kit or scaffolded-script changes run `node scripts/sync-templates.mjs`.
The materialization integration test checks byte parity and builds/renders the
copied app outside this repository. Browser failure tests use disposable copies
and preserve individual logs under `.artifacts/test-logs/`; subprocesses and
copies are cleaned up. Generated files, screenshots and dependency directories
are ignored. No hosted CI configuration is included.

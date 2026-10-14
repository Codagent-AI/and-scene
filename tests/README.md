# Scene kit verification

Install dependencies with `npm ci` and Chromium with
`npx playwright install chromium` (add `--with-deps` if system libraries are
missing). Run `npm test`, `npm run lint`, and `npm run build`.

The unit/contract tests cover navigation, chrome, fit math, routing, primitives,
style ownership, and bootstrap kit parity. `tests/payload.types.tsx` is compiled
by `npm run build`; its expected type error checks that malformed payloads are
rejected while typed arrays reach `Presentation` without casts.

`npm test -- tests/scene-kit.browser.test.ts` runs the real-browser portion alone.
It builds a test-only fixture, serves a production preview on `127.0.0.1`, and
uses Chromium to check grouped DOM persistence, actual intermediate layout
motion, delayed entry, departure, controls, keyboard/touch input, focus behavior,
and mode/viewport changes. It writes settled first-through-last screenshots to
`.artifacts/scene-kit/{desktop,narrow}-step-{1,2,3,4}.png` for visual review.
The fixture is not registered in the application.
Motion probes sample animation frames inside Chromium so browser round-trip
latency cannot skip the interval being checked. The test closes its browser and
preview server even after failure.

For interactive inspection, after the browser tests have built the fixture:

```sh
npm exec vite preview -- --config tests/browser.vite.config.ts --host 127.0.0.1 --port 4187 --strictPort
chrome-devtools-axi open http://127.0.0.1:4187/tests/fixtures/scene-kit/index.html
chrome-devtools-axi snapshot
chrome-devtools-axi screenshot .artifacts/scene-kit/interactive.png
```

Use AXI to inspect first, dense (third), and final steps at 1440 × 900 and
390 × 844. The fixture owns its CSS; the reusable kit remains unstyled.

`npm run verify` builds the application and renders every registered presentation,
checking the canonical sample's nine titles and captions against `verify.config.json`.
`npm run test:e2e` exercises the verification failure contract in disposable app copies.

`npm run inspect -- how-to-make-a-presentation` captures every settled step to
`.inspection/how-to-make-a-presentation/step-NN.png`. It reuses the production
build, or builds when `dist/index.html` is absent; pass `--build` to rebuild.
Use `--viewport 390x844` for narrow composition and `--settle 1200` to override
the wait derived from the kit's morph and entry constants (plus a 150 ms margin).
The helper prints step-specific `WARN` lines for unmarked text/chrome collisions,
indistinct active progress/ToC controls, and missing, tiny, default, or clipped
attribution. Warnings are advisory; real route, hook, transition, build, and
browser failures exit nonzero. Only intentional readable compositions should
use `data-presentation-allow-overlap` on the relevant subtree. Screenshots are
ignored inspection artifacts and require visual review, not pass/fail evidence.

`npm run test:integration` runs INT-001 and INT-002 separately from `npm test`. It registers
controlled fixtures only in a disposable repository-local copy, tests advisory
warnings and exemptions, decodes captured pixels to prove delayed scene content
settled, checks missing attribution and genuine failures, and confirms the sample
is warning-free at desktop and narrow sizes. The helper's bootstrap copy must
remain byte-aligned with `scripts/inspect-presentation.mjs`.

INT-001 materializes the complete bootstrap in an OS temporary directory outside
the repository, installs from its own lock data (no node_modules symlink), verifies
the empty registry, then registers the two-step presentation template and lints,
builds, renders both steps through `npm run verify`, and captures them with its
local inspection helper. The disposable app is removed after the test.

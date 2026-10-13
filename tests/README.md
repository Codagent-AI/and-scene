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
The fixture is not registered in the application; Task 01's registry stays empty.
The test closes its browser and preview server even after failure.

For interactive inspection, after the browser tests have built the fixture:

```sh
npm exec vite preview -- --config tests/browser.vite.config.ts --host 127.0.0.1 --port 4187 --strictPort
chrome-devtools-axi open http://127.0.0.1:4187/tests/fixtures/scene-kit/index.html
chrome-devtools-axi snapshot
chrome-devtools-axi screenshot .artifacts/scene-kit/interactive.png
```

Use AXI to inspect first, dense (third), and final steps at 1440 × 900 and
390 × 844. The fixture owns its CSS; the reusable kit remains unstyled.
The canonical nine-step sample, `npm run verify`, and `npm run inspect` are
separate follow-on tasks and are not supplied by this scene-kit task.

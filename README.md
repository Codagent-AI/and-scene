# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm install
npm run dev
npm run build
```

## Browser verification and visual inspection

Install dependencies with `npm ci`, then install the Playwright Chromium browser
once with `npx playwright install chromium`. `npm run verify` builds the complete
app and opens every registered presentation in a production preview on
`127.0.0.1`; when `scripts/reference-sample.json` is present it also checks the
committed sample's ordered titles and captions. The expectations file is
deliberately optional so the same script can be copied into a new scaffold.

Run `npm run inspect -- <slug>` to capture every step at 1440 × 900 under
`.and-scene/screenshots/<slug>/`. Use `--narrow` for a 390 × 844 viewport and
`--settle=1800` (or `AND_SCENE_SETTLE_MS=1800`) to change the animation settle
time. Diagnostic warnings are advisory. Run `npm run test:integration` for the
production browser and subprocess checks; that command installs Chromium.

## Current State

The repository includes the presentation skill and bootstrap templates, a
reusable scene kit, and the registered `how-to-make-a-presentation` example.

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

## Verification and inspection

Run `npm ci`, then install Chromium used by the render checks with
`npx playwright install chromium`. `npm run verify` builds the app and opens the
reference presentation in Chromium against a production preview on
`127.0.0.1`.

`npm run inspect -- how-to-make-a-presentation` rebuilds the app, captures each
settled step at 1440 × 900, and writes screenshots under
`artifacts/inspection/<slug>/`. Add `--narrow` for a 390 × 844 viewport or
`--settle <milliseconds>` to change the default 900 ms animation wait. Warnings
are advisory. Inspection artifacts are git-ignored.

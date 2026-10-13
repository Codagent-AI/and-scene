# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
npm run verify
```

The browser verification uses Playwright Chromium. Install the browser once with
`npx playwright install chromium` before running `npm run verify`.

## Current State

The repository includes a reusable presentation scene kit, the reference sample,
and an OpenSpec proposal for the presentation-generation skill.

## Inspect a presentation

Capture a settled production-preview screenshot for every step and review advisory visual diagnostics:

```bash
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --viewport 390x844 --settle 1600
```

The helper builds when `dist/` is missing or stale. Use `--no-build` to require an existing current build, `--settle <ms>` to set the wait after each step (default 1200), `--viewport WxH` to choose a browser viewport (default 1440x900), or `--port <port>` to select the preview port. Screenshots are written to `.presentation-inspection/<slug>/step-NN.png`; that directory is ignored by Git. Warnings identify likely overlap, indistinct active navigation, or attribution styling issues and remain advisory. If two elements intentionally overlap, mark their shared subtree with `data-presentation-allow-overlap`; only use the marker when the composition remains readable. Attribution should be styled through `data-presentation-attribution`, with at least an 11px font and 24px clickable height.

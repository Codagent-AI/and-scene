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

## Presentation verification and visual inspection

```bash
npm run verify
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --viewport=390x844 --settle=1800
```

`verify` builds the app, checks the registered nine-step reference outline, then
renders every step in Chromium against a production preview on `127.0.0.1`. It
exits non-zero and names the failed phase (and step for render faults). Install
the browser once with `npx playwright install chromium`.

`inspect` builds the production app and writes settled screenshots
to `.inspection/<slug>/step-NN.png` (git-ignored). The default viewport is
1440×900 and the default settle delay is 1300ms; use `--viewport=WxH`,
`--settle=MS`, or `AND_SCENE_SETTLE_MS` to adjust them. Visual warnings are
advisory and do not fail the command; setup or browser errors exit non-zero.

## Current State

This repository currently contains a minimal Vite, React, and TypeScript
scaffold plus an OpenSpec proposal for the future skill implementation.

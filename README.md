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

## Current State

This repository currently contains a minimal Vite, React, and TypeScript
scaffold plus an OpenSpec proposal for the future skill implementation.

## Inspect a presentation

Use the project-local helper to build a production preview, capture every settled
step, and review advisory visual diagnostics:

```bash
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --viewport 390x844
```

The default viewport is `1440x900`; the default settle interval is 850 ms, longer
than the kit's 700 ms newcomer delay plus transition. Screenshots are written to
`artifacts/inspect/<slug>/<viewport>/step-01.png`, `step-02.png`, and so on.
`report.json` records the zero-based index, step ID, screenshot path, warnings,
and entity opacity at capture time. Generated artifacts are gitignored.

Optional arguments are `--viewport <W>x<H>`, `--settle <milliseconds>`,
`--out <directory>` (replaces the output directory), and `--no-build` (uses an
existing production build). Chromium must be installed through Playwright.
The preview and browser use `127.0.0.1` and are stopped on success, failure, or
interruption.

Warnings identify the step and hook to review: `overlap` flags intersecting
visible text or chrome; `active-chrome` compares active and inactive navigation
styles; `attribution` flags a missing, invisible, undersized, or browser-default
link. Warnings are advisory and exit successfully; unknown slugs and operational
failures exit non-zero. Review screenshots to distinguish composition defects
from heuristic false positives. Mark only readable, intentional compositions
with `data-presentation-allow-overlap` on the affected subtree, and style chrome
through presentation-owned CSS. `npm run verify` remains the automated render
gate; inspection does not replace it.

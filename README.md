# and-scene

And Scene is a small Vite, React, and TypeScript app for browser presentations
that unfold as one evolving diagram. The style-neutral scene kit provides
navigation and motion primitives; each presentation owns its content and CSS.

## Development

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

## Current State

Presentations live in `src/presentations/` and are registered explicitly in
`src/presentations/index.ts`. The landing page lists registered presentations;
each slug is available at `/<slug>`. The committed
`how-to-make-a-presentation` example demonstrates a grouped, continuously
evolving scene.

## Verify and inspect presentations

`npm run verify` builds the application, checks that the nine-step reference
presentation is registered and ordered correctly, and opens every step in a
Playwright Chromium production preview at `127.0.0.1`. Install a browser with
`npx playwright install chromium` if needed; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
or `CHROME_PATH` to use a system browser.

`npm run inspect -- <slug>` builds the app and captures each settled step to
`.presentation-inspection/<slug>/step-NN.png`. Options are `--out <dir>`
(artifact root), `--settle <ms>` (default 1200), `--width <px>` and
`--height <px>` (default 1440 × 900), and `--skip-build` to use the existing
`dist/` output. The helper reports advisory `overlap`, `active-nav`, and
`attribution` warnings; warnings do not make inspection fail.

## Presentation skill and templates

The distributable agent skill is in [`skills/presentation/SKILL.md`](skills/presentation/SKILL.md). It gathers a topic and step descriptions, detects or bootstraps the three app anchors, creates a registered presentation, and runs build, render, and visual inspection checks. Its bootstrap snapshot is a standalone Vite/React/TypeScript app; the presentation starter lives in `skills/presentation/templates/presentation/`.

`src/presentation-kit/` is canonical. Refresh its bootstrap snapshot, the project-local inspection helper, and the verifier with `node skills/presentation/scripts/sync-templates.mjs`. Tests enforce byte-for-byte kit, inspection-helper, and verifier alignment (excluding kit tests). The shared verifier checks every registered route and step when no `verify.config.json` is present. This repository's config additionally requires the canonical nine-step reference sample and its ordered titles and captions.

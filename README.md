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

## Verify and inspect presentations

Install the Playwright Chromium browser once with `npx playwright install chromium`.
`npm run verify` builds the application and renders every step of the committed
reference presentation against a production preview. `npm run inspect -- <slug>`
captures settled step screenshots and advisory visual diagnostics under
`.inspection/`; for example:

```bash
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

Inspection also accepts `--settle <ms>`, `--no-build`, `--port <number>`,
`--width <pixels>`, and `--height <pixels>`.

## Current State

The repository includes the reusable scene kit, a nine-step reference
presentation, and production verification and inspection scripts. The
OpenSpec change defines the distributable skill and scaffold workflow.

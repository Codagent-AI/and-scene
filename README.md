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

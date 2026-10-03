# Presentation app bootstrap

This is a complete, style-neutral Vite + React + TypeScript application. Copy
the contents of this directory to the app root. The `src/presentation-kit/`
folder is a release snapshot of the canonical kit. Add a presentation folder and
one explicit lazy import in `src/presentations/index.ts`.

Run `npm install`, `npx playwright install chromium`, `npm run build`, and
`npm run verify`. Verification renders the landing page and the first step of
every registered presentation; set `PRESENTATION_ROUTE=/your-route` to check one
route. Use `npm run inspect -- /your-route` to capture settled step
screenshots and review the emitted advisory warnings. Set `INSPECT_SETTLE_MS`
(default 1100) when custom transitions need longer to settle.

# And Scene

And Scene is a small React and TypeScript app for browser presentations built
as one diagrammatic scene that evolves through named steps. Stable entities
appear, move, connect, and change labels while the viewer follows the story.

The reusable scene kit is in `src/presentation-kit/`. The distributable
presentation skill and fresh-project templates are in `skills/presentation/`.
The committed reference presentation, “How to Use This Skill to Make a
Presentation,” lives under `src/presentations/` and is available at
`/how-to-make-a-presentation`.

## Development

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run verify
npm run inspect -- how-to-make-a-presentation
```

`npm run verify` builds the app and uses Playwright with Chromium to render all
nine reference steps from the production preview. `npm run inspect` captures
settled screenshots in `artifacts/inspection/` and reports advisory visual
warnings.

Presentations support browse and present modes. Use Right/Space/PageDown to
advance, Left/PageUp to go back, and `P` to switch modes. Progress controls and
the table of contents jump directly to steps or sections; horizontal touch
swipes also navigate.

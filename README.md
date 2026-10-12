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
evolving scene. Browser verification and inspection scripts are planned for a
later slice.

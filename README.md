# and-scene

And Scene creates browser presentations as one evolving diagram: stable elements
appear, move, connect, and change through named steps.

Use the [presentation skill](skills/presentation/SKILL.md) to create or modify a
presentation. It includes a self-contained React/Vite/TypeScript bootstrap and a
style-neutral scene kit. Presentations own their CSS.

## Development

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173/how-to-make-a-presentation for the nine-step reference,
or the root page for the registry.

Run `npm test`, `npm run lint`, and `npm run build` for local checks.
Install the browser with `npx playwright install chromium`, then run
`npm run verify` for production browser verification and
`npm run inspect -- how-to-make-a-presentation` for screenshots and diagnostics.
For another registered route, use `node scripts/verify.mjs <slug>`.

The canonical kit lives in `src/presentation-kit/`; its bootstrap snapshot and
verification scripts must remain byte-aligned. The approved OpenSpec change
remains in `openspec/changes/create-and-scene/`.

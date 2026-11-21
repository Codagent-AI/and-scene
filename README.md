# And Scene

And Scene builds browser presentations as one diagram that evolves through named steps. The reference presentation, **How to Use This Skill to Make a Presentation**, is available from the app's landing page.

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

## Create or modify a presentation

Give an agent the [presentation skill](skills/presentation/SKILL.md) and a topic. The skill can use this app or scaffold a new one from its bundled templates. Each presentation owns its visual style and is registered in `src/presentations/index.ts`. The reusable kit handles the fixed canvas, scene transitions, and navigation.

## Verify the app

Install Chromium with `npx playwright install chromium` before running browser checks.

```bash
npm test
npm run lint
npm run build
npm run test:browser
npm run verify
```

The verification command builds the app and checks every step of the reference presentation in Chromium. To verify another registered presentation, run `npm run verify -- <slug>`. For settled screenshots and advisory diagnostics, run `npm run inspect -- <slug>`. Add `--width 390 --height 844` for a narrow capture. Captures are stored under `artifacts/presentations/`.

When changing the kit or browser scripts, update the matching bootstrap copies under `skills/presentation/templates/bootstrap/`.

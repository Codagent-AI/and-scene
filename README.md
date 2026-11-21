# And Scene

And Scene creates browser presentations that explain an idea through one
evolving diagram. Step changes can introduce, move, connect, or re-label
entities while preserving their identities.

```bash
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open the landing page at `http://127.0.0.1:5173/` to choose a registered
presentation. The worked example is at `/how-to-make-a-presentation`.
Use the arrow keys to step through it and P to switch between browse and
present modes.

The [presentation skill](skills/presentation/SKILL.md) contains the procedure
and standalone templates for creating or modifying a presentation. The
[scene kit](src/presentation-kit/) provides motion, layout, navigation, and
styling hooks. Each presentation owns its visual treatment.

```bash
npm test
npm run lint
npm run build
npm run verify
npm run test:browser
npm run inspect -- how-to-make-a-presentation
```

`npm test` runs unit, component, and type contract checks.
`npm run test:browser` exercises the packaged bootstrap, screenshot helper,
and production verification success and failure cases with Chromium. The
inspection command writes settled step captures and advisory warnings to
`artifacts/presentation-inspection/`. Add `--viewport=390x844` for a narrow
capture.

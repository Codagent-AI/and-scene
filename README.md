# And Scene

A presentation is one diagram developing through named states. The reference at
`/how-to-make-a-presentation` explains the workflow using its own output.

```
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/` for the registry. Right/Space/PageDown advance; Left/PageUp retreat;
P toggles browse/present. Swipe horizontally or use browse progress and section
controls. Navigation clamps at the ends and leaves focused controls' keys alone.

Use [the presentation skill](skills/presentation/SKILL.md) to gather a story,
bootstrap an app, create a presentation, or modify an identified one. Templates
resolve relative to the installed skill. Bootstrap is self-contained and includes
the reference, kit, locked dependencies, and local scripts. The scaffold helper
prints a target plan before applying changes; non-empty targets require confirmation.
For custom layouts the skill checks equivalent anchors before using the helper.

Every presentation owns its CSS. The kit provides geometry, motion, navigation,
and stable `data-presentation-*` hooks without visual defaults. Keep canonical
kit and bootstrap copies identical using `node scripts/sync-bootstrap.mjs`.

```
npm test                  # fast Vitest/component contracts
npm run test:integration  # INT-001/002 and E2E-001/002, real Chromium
npm run lint
npm run build
npm run verify            # production build and nine-step browser gate
npm run inspect -- how-to-make-a-presentation
```

Inspection writes ignored `artifacts/inspection/<slug>/step-NN.png` files after
900ms settling. Override `INSPECT_SETTLE_MS` for slower author animations. Its
step-specific collision, active-state, and attribution warnings are advisory;
review composition before claiming visual quality. Mark only intentional readable
overlap subtrees `data-allow-overlap="true"`. Screenshots are review artifacts,
not a visual-quality pass/fail assertion. Verification uses IPv4 loopback and
cleans up preview/browser processes on success and failure.

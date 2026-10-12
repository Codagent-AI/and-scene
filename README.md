# and-scene

And Scene is a project for building browser presentations as one evolving
diagram. Stable entities move through named steps as an explanation develops.
The reusable React scene kit supplies behavior and geometry; each presentation
owns its visual style.

## Development

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
```

## Verify and inspect

Install Playwright Chromium once with `npx playwright install chromium`. Then:

```bash
npm run verify
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --narrow
npm run test:integration
```

`verify` builds the app and renders each registered presentation in a production
preview at `127.0.0.1`; the committed reference sample's ordered titles and
captions are checked when `scripts/reference-sample.json` exists. That file is
intentionally omitted from the bootstrap, so a new app verifies registered
routes in generic mode. `inspect` captures settled per-step screenshots beneath
`.and-scene/screenshots/<slug>/` and prints advisory visual warnings. Review the
first, last, dense/key steps, and narrow screenshots when responsive-sensitive;
fix accidental collisions and polish active controls and attribution. Warnings
are not a pass/fail gate.

## Presentation skill

The distributable skill is [skills/presentation/SKILL.md](skills/presentation/SKILL.md).
It gathers a topic and visual direction, resolves a standalone or monorepo
scaffold target, creates or modifies registered presentations, and verifies
and inspects the result. Its templates are resolved relative to the skill file,
not the caller's current directory. The skill includes a Vite/React/TypeScript
bootstrap and a presentation starter under `skills/presentation/templates/`.
The scaffold is CSS-neutral; presentation-local CSS owns the visual design.

## Template maintenance

`src/presentation-kit/` is canonical. Keep all its non-test files byte-aligned
with `skills/presentation/templates/bootstrap/src/presentation-kit/`. Keep the
root `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`,
`scripts/preview-process.mjs`, and `scripts/preview-process.d.mts` byte-aligned
with the bootstrap copies. `npm run test:integration` checks parity and
materializes a fresh bootstrap outside the source tree before installing,
building, and rendering a registered route.

The worked example at
`src/presentations/how-to-make-a-presentation/` demonstrates the skill's
nine-step evolving-scene conventions.

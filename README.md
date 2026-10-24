# and-scene

And Scene is an agent skill that generates browser presentations modeled as **one diagrammatic
scene that evolves through named steps**: elements appear, move, connect, and re-label as the
explanation develops, rather than a deck of unrelated slides.

## Layout

- `skills/presentation/` is the distributable skill: `SKILL.md`, helper scripts, and the scaffold
  templates (`templates/bootstrap/` is a snapshot of the app below; `templates/presentation/` is the
  per-presentation starter).
- `src/presentation-kit/` is the canonical, style-neutral React scene kit.
- `src/presentations/` holds the registry and the committed sample, "How to Use This Skill to Make
  a Presentation".
- `scripts/verify.mjs` builds the app and renders every presentation in Chromium;
  `scripts/inspect-presentation.mjs` captures settled per-step screenshots with advisory warnings.

## Development

```bash
npm ci
npm test                  # fast unit and component tests
npm run lint
npm run build
npm run verify            # build plus browser-render verification
npm run inspect -- how-to-make-a-presentation
npm run test:integration  # bootstrap template + screenshot helper (needs Chromium)
npm run test:e2e          # verification gate and its failure modes (needs Chromium)
```

After changing the kit, `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, or shared app
files, run `npm run sync:template` to refresh `skills/presentation/templates/bootstrap/` (the unit
tests fail when it has drifted).

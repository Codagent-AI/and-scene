# and-scene

And Scene is a presentation-generation agent skill plus the scene kit it builds on.
A presentation is not a stack of unrelated slides: it is one diagrammatic scene that
evolves through named steps, where elements appear, move, connect, and re-label as the
talk arc develops.

## Layout

- `skills/presentation/`: the agent skill (`SKILL.md`) and its scaffold templates
- `src/presentation-kit/`: the reusable, style-neutral scene kit (canonical source)
- `src/presentations/`: the registry and the committed sample, "How to Use This Skill to Make a Presentation"
- `scripts/verify.mjs`: build and browser-render verification
- `scripts/inspect-presentation.mjs`: per-step screenshots and advisory visual warnings

`skills/presentation/templates/bootstrap/` carries a snapshot of the kit and scripts; run
`npm run sync:templates` after changing either.

## Development

```bash
npm ci
npm run dev
npm test                  # fast unit and contract tests
npm run test:integration  # bootstrap + screenshot-helper tests (needs Chromium)
npm run test:e2e          # production verification and its failure contract (needs Chromium)
npm run lint
npm run build
npm run verify            # build plus browser-render verification of every step
npm run inspect -- how-to-make-a-presentation   # screenshots in .inspection/
```

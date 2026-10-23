# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Layout

- `skills/presentation/`: the distributable agent skill (`SKILL.md`), its scaffold helper and templates.
- `src/presentation-kit/`: the style-neutral scene kit (canonical copy; the skill's bootstrap template mirrors it byte for byte, see `npm run sync:templates`).
- `src/presentations/`: the registry and the worked example, `how-to-make-a-presentation`.
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`: build and browser-render verification, and settled screenshots with advisory visual warnings.

## Development

```bash
npm ci
npx playwright install chromium   # once, for verify and inspect
npm run dev
npm test                  # fast Vitest unit, component and contract tests
npm run lint
npm run build
npm run verify            # build + render every step of the sample in Chromium (127.0.0.1)
npm run test:integration  # bootstrap materialization and screenshot helper
npm run test:e2e          # verify against faulty throwaway copies
npm run inspect -- how-to-make-a-presentation [--narrow] [--settle=<ms>]
```

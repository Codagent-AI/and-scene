# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npm test                 # fast unit and contract tests (Vitest)
npm run test:integration # bootstrap, screenshot helper and verification end-to-end tests (Chromium)
npm run lint
npm run build
npm run verify           # build plus browser-render verification of every step
npm run inspect -- how-to-make-a-presentation   # settled per-step screenshots and advisory warnings
npm run sync:templates   # refresh the skill's bootstrap template after changing the kit or scripts
```

## Layout

- `skills/presentation/`: the agent skill (`SKILL.md`), its setup helper, and scaffold templates
- `src/presentation-kit/`: style-neutral scene kit (canonical source)
- `src/presentations/`: registry and the committed sample, "How to Use This Skill to Make a Presentation"
- `scripts/`: `verify.mjs` and `inspect-presentation.mjs`

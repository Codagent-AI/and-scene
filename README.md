# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npm test            # fast unit and contract tests (Vitest)
npm run test:browser  # integration + end-to-end tests (real builds, Chromium)
npm run lint
npm run build
npm run verify      # build + render every registered presentation step by step
npm run inspect -- how-to-make-a-presentation   # per-step screenshots + advisory warnings
npm run sync:templates  # refresh skills/presentation/templates/bootstrap from the canonical sources
```

## Layout

- `skills/presentation/` — the agent skill (`SKILL.md`), its scaffold helper, and templates
- `src/presentation-kit/` — the style-neutral scene kit (snapshotted into the bootstrap template)
- `src/presentations/` — the registry and the sample, "How to Use This Skill to Make a Presentation"
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` — browser verification and inspection

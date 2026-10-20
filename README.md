# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npm run dev
npm test                   # fast unit and contract tests
npm run lint
npm run build              # TypeScript and production build
npm run verify             # build plus browser-render verification
npm run test:integration   # bootstrap, screenshot-helper, and verification-failure suites (needs Chromium)
npm run inspect -- how-to-make-a-presentation
```

## Layout

- `src/presentation-kit/`: the style-neutral scene kit (stage, navigation, chrome, node primitives).
- `src/presentations/`: the explicit registry and the reference sample, "How to Use This Skill to Make a Presentation".
- `skills/presentation/`: the agent skill (`SKILL.md`), its scaffold helper, and the bootstrap and presentation templates.
- `scripts/verify.mjs` and `scripts/inspect-presentation.mjs`: verification and screenshot diagnostics.

`skills/presentation/templates/bootstrap/` is generated: run `npm run sync:template` after changing the kit, the
sample, the host app, or either script. A unit test fails when the snapshot drifts.

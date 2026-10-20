# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npm run dev
npm test                 # fast unit and contract tests
npm run test:integration # bootstrap, screenshot helper, and verification failure suites (Chromium)
npm run lint
npm run build
npm run verify           # build plus browser-render verification of the reference presentation
npm run inspect -- how-to-make-a-presentation   # settled screenshots + advisory visual warnings
```

## Layout

- `skills/presentation/` — the distributable agent skill (`SKILL.md`), its scaffolder, and templates.
- `src/presentation-kit/` — the style-neutral scene kit (canonical source).
- `src/presentations/` — the presentation registry and the reference presentation.
- `scripts/` — `verify.mjs` and `inspect-presentation.mjs`.
- `tools/sync-templates.mjs` — refreshes the bootstrap template's copies of the kit, scripts, and host
  entry files; run it after changing any of them.

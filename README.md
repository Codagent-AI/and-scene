# and-scene

And Scene is a presentation-generation agent skill plus the reusable scene kit
it builds on. A presentation is not a stack of unrelated slides: it is one
diagrammatic scene that evolves through named steps, where stable entities
appear, move, connect, and re-label as the explanation develops.

## Layout

- `skills/presentation/`: the distributable skill (`SKILL.md`, the `scaffold.mjs`
  helper, and the `templates/` used to bootstrap a fresh project)
- `src/presentation-kit/`: the canonical, style-neutral scene kit
- `src/presentations/`: the registry and the committed sample,
  "How to Use This Skill to Make a Presentation"
- `scripts/verify.mjs`: build and browser-render verification
- `scripts/inspect-presentation.mjs`: per-step screenshots and advisory
  visual diagnostics

## Development

```bash
npm ci
npm run dev
npm test                  # unit and contract tests
npm run lint
npm run build
npm run verify            # build + render every step on 127.0.0.1 (needs Chromium)
npm run inspect -- how-to-make-a-presentation   # screenshots in .inspect/
npm run test:integration  # bootstrap, inspection, and verification-failure suites
npm run sync:templates    # refresh the bootstrap template's kit and script copies
```

The kit in `src/presentation-kit/` and the scripts under `scripts/` are the
sources of truth; the copies under `skills/presentation/templates/bootstrap/`
are refreshed with `npm run sync:templates` and checked for drift by the
integration suite.

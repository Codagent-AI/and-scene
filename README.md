# and-scene

And Scene builds browser presentations that behave like one evolving diagram: stable
entities appear, move, connect, and re-label as named steps advance, instead of a deck
of unrelated slides. It ships an agent skill that creates them from a topic, a reusable
style-neutral scene kit, and the checks that prove a presentation builds and renders.

## Layout

- `skills/presentation/`: the distributable skill (`SKILL.md`) and its templates
  (`templates/bootstrap/` for a fresh app, `templates/presentation/` for one presentation).
- `src/presentation-kit/`: the canonical scene kit. Its copy under
  `templates/bootstrap/src/presentation-kit/` must stay byte-identical, as must the shared
  files in `scripts/`.
- `src/presentations/`: the registry (`index.ts`) and the committed sample,
  `how-to-make-a-presentation`.
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`: build + render verification and
  settled per-step screenshots with advisory visual warnings.

## Commands

```bash
npm ci
npm run dev
npm test                 # fast unit, contract, and component tests
npm run test:integration # bootstrap, screenshot-helper, and verification-failure suites (needs Chromium)
npm run lint
npm run build
npm run verify           # build, check the sample, render every step in Chromium
npm run inspect -- how-to-make-a-presentation [--narrow]   # writes .inspection/<slug>/step-NN.png
```

The kit owns behavior, canvas geometry, and `data-presentation-*` hooks only. Each
presentation brings its own CSS. Local browser automation uses `127.0.0.1`.

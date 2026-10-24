# and-scene

And Scene is a presentation-generation agent skill plus the scene kit it builds on.

A presentation here is not a stack of unrelated slides. It is one diagrammatic scene that
evolves through named steps: entities appear, move, connect, and re-label in place as the
talk arc develops.

## Layout

- `skills/presentation/` – the distributable agent skill (`SKILL.md`), a target-detection
  helper, and the bootstrap/presentation templates it scaffolds from.
- `src/presentation-kit/` – the style-neutral scene kit (motion, fixed 880 × 380 canvas,
  navigation, present/browse chrome, stable `data-presentation-*` hooks). It owns no colors,
  fonts, or themes.
- `src/presentations/` – the explicit presentation registry and the worked sample
  *How to Use This Skill to Make a Presentation*.
- `scripts/verify.mjs` – build plus browser-render verification.
- `scripts/inspect-presentation.mjs` – settled per-step screenshots and advisory visual warnings.

## Development

```bash
npm ci
npm run dev
npm test                  # fast unit and contract tests (Vitest)
npm run test:integration  # bootstrap, screenshot-helper, and verify end-to-end suites (Chromium)
npm run lint
npm run build
npm run verify            # build, then render every registered presentation in Chromium
npm run inspect -- how-to-make-a-presentation   # screenshots under .presentation-artifacts/
npm run sync:templates    # re-copy the kit and shared scripts into the bootstrap template
```

`src/presentation-kit/`, `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, and
`scripts/lib/preview.mjs` are mirrored byte-for-byte in
`skills/presentation/templates/bootstrap/`; run `npm run sync:templates` after changing them.

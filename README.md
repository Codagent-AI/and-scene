# and-scene

And Scene is a presentation-generation agent skill plus the scene kit it builds on.

A presentation is not a stack of unrelated slides. It is one diagrammatic scene that
evolves through named steps: elements appear, move, connect, and re-label as the
explanation develops, with stable entities morphing in place.

## Layout

- `skills/presentation/`: the distributable agent skill (`SKILL.md`), its scaffolding
  scripts, and the bootstrap and presentation templates.
- `src/presentation-kit/`: the canonical, style-neutral React scene kit. It owns motion,
  fixed-canvas layout, navigation, and `data-presentation-*` hooks; presentations own
  every visual choice.
- `src/presentations/`: the presentation registry and the committed reference
  presentation, "How to Use This Skill to Make a Presentation".
- `scripts/verify.mjs`: build plus real-browser render verification.
- `scripts/inspect-presentation.mjs`: settled per-step screenshots and advisory visual
  diagnostics.

## Development

```bash
npm ci
npm run dev
npm test                   # fast unit and contract tests (Vitest)
npm run test:integration   # browser- and filesystem-backed integration and end-to-end tests
npm run lint
npm run build
npm run verify             # build, then render every presentation step in Chromium
npm run inspect -- how-to-make-a-presentation
```

`verify` and `inspect` use Playwright Chromium on `127.0.0.1`
(`npx playwright install chromium` if it is missing). Screenshots go to `.inspection/`,
which is not committed.

The bootstrap template under `skills/presentation/templates/bootstrap/` carries copies of
the kit and the verification scripts. After changing any of them, run
`npm run sync:templates`; `node scripts/sync-templates.mjs --check` reports drift.

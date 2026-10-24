# and-scene

And Scene builds browser presentations that work as one evolving diagram: a single
scene whose entities appear, move, connect, and re-label as named steps advance,
rather than a stack of unrelated slides.

## What is here

- `skills/presentation/` – the distributable agent skill (`SKILL.md`), its
  `scripts/scaffold.mjs` helper, and the `templates/` used to bootstrap a fresh project.
- `src/presentation-kit/` – the canonical, style-neutral scene kit (engine, chrome,
  generic node primitives). It ships no colours, fonts, or themes; presentations own their look.
- `src/presentations/` – the registry (`index.ts`) and the committed sample,
  `how-to-make-a-presentation`, served at `/how-to-make-a-presentation`.
- `scripts/verify.mjs` – build plus real-browser render verification.
- `scripts/inspect-presentation.mjs` – settled per-step screenshots and advisory visual diagnostics.

## Development

```bash
npm ci
npm test                 # fast Vitest unit, component, and contract tests
npm run lint
npm run build            # tsc -b && vite build
npm run verify           # build + sample outline + Chromium render of every step on 127.0.0.1
npm run inspect -- how-to-make-a-presentation   # screenshots in inspection/<slug>/ (git-ignored)
npm run test:integration # INT-001 (bootstrap) and INT-002 (screenshot helper)
npm run test:e2e         # E2E-001 and E2E-002 (verify passes / fails loudly)
```

The slow suites need Playwright's Chromium (`npx playwright install chromium`).
`npm run verify -- <slug>` checks one registered presentation instead of the sample.

## Keeping the template in sync

`skills/presentation/templates/bootstrap/` carries byte-identical copies of the kit and
the verification scripts. After changing them run `npm run sync:template`; a unit test
and INT-001 fail on drift.

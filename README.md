# and-scene

And Scene builds browser presentations that work as **one evolving diagram**: stable
entities appear, move, connect, and re-label across named steps, instead of a stack of
unrelated slides. An agent skill generates them from a topic.

## Layout

- `skills/presentation/` — the distributable agent skill (`SKILL.md`) and its templates
  (`templates/bootstrap/` scaffolds a fresh app; `templates/presentation/` is one new presentation).
- `src/presentation-kit/` — the canonical, style-neutral scene kit (a byte-aligned copy lives in the
  bootstrap template).
- `src/presentations/` — the presentation registry and the committed sample,
  "How to Use This Skill to Make a Presentation" (`/how-to-make-a-presentation`).
- `scripts/verify.mjs` — build plus browser-render verification; `scripts/inspect-presentation.mjs` —
  settled per-step screenshots and advisory visual warnings.

## Development

```bash
npm ci
npm run dev
npm test                  # fast Vitest unit and contract tests
npm run test:integration  # bootstrap materialization and screenshot helper (Chromium, network for npm ci)
npm run test:e2e          # `npm run verify` success and failure paths (Chromium)
npm run lint
npm run build
npm run verify            # build, then step every configured route in Chromium on 127.0.0.1
npm run inspect -- how-to-make-a-presentation   # screenshots in inspection-output/<slug>/
```

`verify.config.json` lists the routes `npm run verify` renders (and the normative step outline for the
sample). Browser tooling needs Chromium (`npx playwright install chromium`).

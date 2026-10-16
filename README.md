# and-scene

And Scene generates browser presentations that work as **one evolving diagram**
rather than a stack of slides: entities keep a stable identity and morph, appear,
connect, and re-label as the explanation moves through named steps.

## Layout

- `skills/presentation/` — the distributable agent skill (`SKILL.md`), its scaffold
  scripts (`scripts/detect.mjs`, `scripts/scaffold.mjs`) and templates
  (`templates/bootstrap/`, `templates/presentation/`).
- `src/presentation-kit/` — the canonical, style-neutral scene kit. The skill's
  bootstrap template carries a byte-aligned snapshot (checked by `npm test`).
- `src/presentations/` — the registry (`index.ts`) and the worked sample,
  "How to Use This Skill to Make a Presentation", at `/how-to-make-a-presentation`.
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` — browser verification
  and screenshot/diagnostic helpers (also snapshotted into the bootstrap template).

## Development

```bash
npm ci
npm run dev
npm test           # Vitest unit, contract, integration, and failure-path tests
npm run lint
npm run build      # tsc -b && vite build
npm run verify     # build + render the sample through every step on 127.0.0.1
npm run inspect -- how-to-make-a-presentation   # screenshots + advisory warnings in .inspection/
```

`verify` and `inspect` use Playwright Chromium (`npx playwright install chromium`).
The kit ships no CSS, colors, fonts, or styling framework: presentations own their
look and style the stable `data-presentation-*` hooks.

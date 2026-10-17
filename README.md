# and-scene

And Scene turns a topic into a browser presentation that works as **one evolving
diagram**: elements appear, move, connect, and re-label across named steps instead of
cutting between unrelated slides.

## What is here

- `skills/presentation/` - the agent skill (`SKILL.md`), its scaffolding helper, and the
  templates it bootstraps new projects from.
- `src/presentation-kit/` - the reusable, style-neutral scene kit (canonical copy; the skill's
  bootstrap template carries a byte-identical snapshot).
- `src/presentations/` - the presentation registry and the committed reference sample,
  "How to Use This Skill to Make a Presentation", at `/how-to-make-a-presentation`.
- `scripts/verify.mjs` - build plus browser-render verification (`npm run verify`).
- `scripts/inspect-presentation.mjs` - settled per-step screenshots and advisory visual
  diagnostics (`npm run inspect -- <slug>`).

## Development

```bash
npm ci
npx playwright install chromium   # once, for verify / inspect / integration tests
npm run dev
```

| Command | What it runs |
| --- | --- |
| `npm test` | Vitest unit and contract tests (fast, no browser) |
| `npm run test:integration` | Browser-backed and subprocess suites: bootstrap materialization, inspection helper, verify failure modes, motion fixtures, sample chrome |
| `npm run lint` | ESLint |
| `npm run build` | TypeScript and production build |
| `npm run verify` | Build, check the reference sample against its outline, and step through it in Chromium on `127.0.0.1` |
| `npm run inspect -- how-to-make-a-presentation` | Screenshots for every step in `.inspection/<slug>/` plus advisory warnings |

Screenshots, `dist/`, and `node_modules/` are never committed.

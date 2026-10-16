# And Scene

And Scene turns a topic into a browser presentation modeled as **one evolving
diagram**: stable entities (boxes, labels, arrows, frames) move through named
steps, morphing in place instead of switching between unrelated slides.

## What is here

- `skills/presentation/` — the distributable agent skill (`SKILL.md`), its
  helper scripts, and the templates it bootstraps new projects from.
- `src/presentation-kit/` — the canonical, style-neutral React scene kit
  (stage, navigation, present/browse chrome, generic node primitives). It ships
  no colors, fonts, or CSS framework; presentations own their styling.
- `src/presentations/` — the registry (`index.ts`) and the committed reference
  sample, "How to Use This Skill to Make a Presentation".
- `scripts/verify.mjs` — build plus production-preview render check of every step.
- `scripts/inspect-presentation.mjs` — settled per-step screenshots and advisory
  visual warnings (text/chrome overlap, indistinct active chrome, attribution).

## Development

```bash
npm ci
npm run dev
npm test                  # Vitest unit and contract tests
npm run test:integration  # bootstrap + screenshot helper (needs Chromium)
npm run test:e2e          # full verification gate and its failure modes (needs Chromium)
npm run lint
npm run build
npm run verify            # build + render all nine sample steps on 127.0.0.1
npm run inspect -- how-to-make-a-presentation   # screenshots in .presentation-artifacts/
```

Browser checks use Playwright Chromium. Mark an intentional, readable overlap
with `data-presentation-allow-overlap` so the inspection helper skips it.

## Keeping templates in sync

`skills/presentation/templates/bootstrap/` is a snapshot of the kit and the
verify/inspect scripts. After changing any of them run `npm run sync:templates`;
unit tests fail if the snapshot drifts.

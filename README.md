# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npx playwright install chromium   # once, for verify / inspect / integration tests
npm run dev
npm test                  # fast unit and contract tests (Vitest)
npm run lint              # ESLint
npm run build             # TypeScript and production build
npm run verify            # build plus browser-render verification (Playwright)
npm run inspect -- how-to-make-a-presentation   # settled screenshots + advisory warnings
npm run test:integration  # slower integration and end-to-end tests (production builds, Chromium)
```

## Layout

- `skills/presentation/`: the distributable agent skill (`SKILL.md`), its helper script, and the
  scaffold templates (`templates/bootstrap/`, `templates/presentation/`).
- `src/presentation-kit/`: the style-neutral scene kit. `npm run sync:template` copies it, the app
  shell, and the verification scripts into the bootstrap template; keep them byte-aligned.
- `src/presentations/`: the explicit presentation registry and the committed reference sample,
  "How to Use This Skill to Make a Presentation" (`/how-to-make-a-presentation`).
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`: verification and visual inspection.

# and-scene

And Scene is a presentation-generation agent skill plus the scene kit it builds on. A presentation is
one diagram that evolves through named steps: elements appear, move, connect, and re-label.

## Layout

- `skills/presentation/` — the distributable skill (`SKILL.md`), scaffold helper, and templates
- `src/presentation-kit/` — the style-neutral React scene kit (canonical source)
- `src/presentations/` — the explicit registry and the worked sample
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` — verification and screenshot helper

## Development

```bash
npm ci
npm test                  # fast unit and contract tests
npm run lint
npm run build
npm run verify            # build + browser render of every registered presentation
npm run test:integration  # bootstrap + screenshot helper (browser-backed)
npm run test:e2e          # verification failure modes (browser-backed)
npm run inspect -- how-to-make-a-presentation
npm run sync:templates    # refresh skills/presentation/templates/bootstrap after kit/script changes
```

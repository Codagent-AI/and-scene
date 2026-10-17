# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Layout

- `skills/presentation/`: the distributable agent skill (`SKILL.md`), its helper script and templates.
- `src/presentation-kit/`: the style-neutral scene kit (canonical source).
- `src/presentations/`: the presentation registry and the committed sample, "How to Use This Skill to Make a Presentation".
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`: browser-render verification and screenshot diagnostics.

The skill's `templates/bootstrap/` is a snapshot of the kit and scripts; after changing a shared file run
`npm run sync:templates`.

## Development

```bash
npm ci
npx playwright install chromium   # once, for verify and inspect
npm run dev
npm test                          # fast unit and contract tests
npm run test:integration          # bootstrap, inspection helper and verification-failure suites (Chromium)
npm run lint
npm run build
npm run verify                    # build plus browser-render verification of every step
npm run inspect -- how-to-make-a-presentation   # screenshots under inspection/<slug>/ and advisory warnings
```

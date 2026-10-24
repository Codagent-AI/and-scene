# and-scene

Browser presentations built as one evolving scene: stable entities that morph, connect, and
re-label across named steps.

- `src/presentation-kit/` — style-neutral scene kit (stage, navigation, chrome, node primitives)
- `src/presentations/` — registry plus the worked sample, *How to Use This Skill to Make a Presentation*
- `skills/presentation/` — the agent skill, scaffold helper, and templates
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` — build/render gate and screenshot diagnostics

```bash
npm ci
npm test                  # fast unit and contract tests
npm run test:integration  # bootstrap, inspection helper, and verification-failure tests (Chromium)
npm run lint
npm run build
npm run verify            # build + render every step of the reference sample
npm run inspect -- how-to-make-a-presentation
```

After changing the kit, host files, or verification scripts, run `node scripts/sync-templates.mjs`
to refresh the skill's bootstrap template.

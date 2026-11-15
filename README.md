# And Scene

A browser presentation is one evolving diagram, with stable entities moving through named steps. Open `/how-to-make-a-presentation` for the nine-step worked example.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

The distributable agent procedure is [skills/presentation/SKILL.md](skills/presentation/SKILL.md). It gathers a story, resolves standalone/monorepo scaffolding, creates or modifies a registered presentation, and verifies the result. Templates resolve relative to the skill rather than the caller's working directory. The copy helper refuses overwrites; partial existing apps need contract-aware adaptation as described in the skill.

Each presentation owns `entities.ts`, typed `steps/`, `Talk.tsx`, and its visual CSS. Add one explicit lazy entry to `src/presentations/index.ts`. Import the behavior-only kit from `src/presentation-kit/`; it supplies no visual theme. Reuse a Scene component and groupKey for adjacent states, namespace layoutIds by presentation, and keep continuing identities mounted. The default design canvas is 880 × 380. Arrows/Space/PageDown and Left/PageUp navigate, P toggles browse/present, and horizontal swipes navigate. Focused controls keep their keys.

```sh
npm test                       # fast Vitest unit and component contracts
npm run test:browser            # INT-001, INT-002, E2E-001, E2E-002
npm run lint
npm run build
npm run verify                 # whole build and canonical reference verification
npm run verify -- my-slug       # whole build and every step of another route
npm run inspect -- my-slug      # settled 1440 × 900 screenshots and advisory warnings
npm run inspect -- my-slug 390  # narrow captures
```

Browser tests use isolated `.test-work/` copies, except INT-001, which materializes its app and caller in an OS temporary directory outside the source repository. All fixtures are cleaned afterward. All previews use `127.0.0.1`. Inspection artifacts go to `artifacts/inspection/<slug>/<width>x<height>/step-01.png` and are ignored by git. Overlap/chrome/attribution warnings are advisory, not a visual score. Review key screenshots; fix accidental collisions in local CSS. Mark only intentional readable overlaps with `data-presentation-allow-overlap` on the smallest relevant subtree. Style active hooks and the attribution locally.

After kit or verification/inspection changes run `node scripts/sync-templates.mjs`. INT-001 checks byte parity and materializes the bootstrap independently, installing its committed lock before building and smoke-checking `/example`. Bootstrap visual treatments are intentionally absent; generated presentations supply their own CSS. In a fresh bootstrap, use `npm run verify -- <slug>` for generated routes; the no-argument reference gate belongs to this repository's canonical sample.

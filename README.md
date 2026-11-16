# And Scene

Browser presentations as one evolving diagram. The committed example is
[How to Use This Skill to Make a Presentation](./src/presentations/how-to-make-a-presentation/).

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/` for the registry or `/how-to-make-a-presentation` for the reference.
Right/Space/PageDown advance; Left/PageUp go back; P toggles present/browse mode.
Horizontal swipes and browse-mode progress/section controls also navigate.
Interactive controls keep their normal keyboard behavior.

```sh
npm test                    # fast Vitest unit/component/contract tests
npm run test:types          # typed grouped payload contract
npm run test:integration    # materialized bootstrap, diagnostics, production/fault tests
npm run lint
npm run build
npm run verify              # strict canonical nine-step production gate
npm run inspect -- how-to-make-a-presentation
```

Inspection writes settled desktop screenshots and an advisory `report.json` under
`artifacts/inspections/<slug>/`; these are ignored, never committed. It reports
unmarked text collisions, indistinct active navigation and unpolished attribution.
Warnings are review aids, not a visual pass/fail score. Mark only readable,
intentional overlap subtrees with `data-presentation-allow-overlap`.

The [presentation skill](./skills/presentation/SKILL.md) includes creation,
modification, scaffold resolution and verification instructions. To distribute it,
copy the whole `skills/presentation/` directory. Bootstrap paths resolve relative
to the skill, and its copier refuses conflicting files. Resolve/authorize the
correct target first; for nonstandard host structures integrate missing contracts
without overwriting existing anchors. A neutral bootstrap starts with an empty
registry; add a presentation before running `npm run verify -- --route <slug>`.
Default verification intentionally requires the canonical reference sample.

The reusable kit owns geometry, motion and behavior only. Presentations own all
colors, fonts and component treatments. Copy the presentation template, namespace
entity IDs and share groupKey + Scene across successive payload states to retain
instances. Add one explicit registry entry per presentation. No router or styling
framework is required. Host branding is opt-in; bottom-right attribution is default.

After kit or runtime-script edits run `node scripts/sync-templates.mjs` to refresh
the distributable snapshot. INT-001 checks byte parity and builds that snapshot
outside its authoring directory. INT-002 checks screenshot artifacts and warnings;
E2E-001/002 exercise production verification and injected faults. Bootstrap tests
install a copied skill outside the source repository in OS temporary directories. Other process tests create and clean workspaces under the ignored
`.test-work/` directory; verification tests observe actual browser and preview
process termination using Linux `/proc`. No hosted CI or publication workflow is
included.

Short viewports use compact chrome geometry, exposed as
`data-presentation-compact="true"`. Presentation-owned CSS should tighten chrome
to those reservations; entity coordinates and typography remain identical across
viewport sizes. The reference sample uses explicit multiline labels with a minimum
27px design font so its important diagram text stays at least 11px at the reported
390×844 portrait and 844×390 landscape sizes. E2E-001 also covers those sizes in
both modes with first/dense/final text measurements and collision diagnostics.

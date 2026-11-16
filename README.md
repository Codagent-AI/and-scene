# And Scene

Browser presentations as one evolving diagram. React + TypeScript + Vite, with a
style-neutral Motion scene kit and a distributable agent skill.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/how-to-make-a-presentation` for the nine-step reference, or `/` for the
explicit presentation registry. Arrow keys, Space and PageUp/PageDown navigate;
P switches browse/present mode. Focused controls retain their native keys.

```sh
npm test                        # fast Vitest unit/component contracts
npm run test:integration         # INT-001/002 and E2E-001/002; real Chromium
npm run lint
npm run build
npm run verify                  # builds and checks every reference step
npm run verify -- another-slug   # builds and checks another registered route
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation 390 844
```

Inspection requires an existing production build. It writes settled per-step
PNGs and `report.json` below `artifacts/inspection/<slug>/<viewport>/`. Warnings
are advisory and require visual review. Intentional readable overlap can be
marked with `data-presentation-allow-overlap`; active controls expose
`data-presentation-active` and semantic `aria-current`. Attribution is styled
through `data-presentation-attribution`.

Use [the presentation skill](skills/presentation/SKILL.md) to gather a story,
bootstrap a project, create or edit a presentation, and verify it. It resolves
its templates relative to the skill directory. The empty-target copier refuses
overwriting existing content; partial scaffolds are integrated anchor by anchor.

The canonical kit is `src/presentation-kit/`; all visual CSS belongs to the
presentation or host. Keep its portable snapshot and browser scripts aligned
with `node scripts/sync-templates.mjs` after changes. The bootstrap includes an
unstyled `example` route; run `npm run verify -- example` there. No CSS framework
or theme is required. New presentations add a folder and one explicit lazy
registry entry in `src/presentations/index.ts`.

Automated integration fixtures are disposable, share dependencies where safe,
and remove their directories and preview processes afterward. Browser gates
remain separate from `npm test`; there is no hosted CI configuration.

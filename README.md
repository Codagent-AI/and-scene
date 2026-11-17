# And Scene

Browser presentations as one evolving diagram. React + TypeScript + Vite, with a style-neutral Motion scene kit.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/` for the registry, or `/how-to-make-a-presentation` for the nine-step reference. Right/Space/PageDown and Left/PageUp navigate; P switches browse/present mode. Horizontal swipes and browse controls also navigate; boundaries clamp.

```sh
npm test                  # fast unit/component and type-contract checks
npm run test:integration  # INT-001, INT-002, E2E-001, E2E-002 (real build/browser)
npm run lint
npm run build
npm run verify            # whole-app build + canonical nine-step browser gate
npm run verify -- another-slug --first
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --narrow
```

Inspection writes settled PNGs and a JSON report under `artifacts/inspection/<slug>/<viewport>/`. Overlap, active-navigation, and attribution diagnostics are advisory, not aesthetic approval. Use `data-presentation-allow-overlap` only on intentional readable overlaps. Outputs, dependencies, and screenshots are ignored by git.

The distributable [presentation skill](skills/presentation/SKILL.md) contains the public create/modify procedure. Its bootstrap is a self-contained, unstyled app; presentation templates provide typed grouped scenes. The authoring sample owns its plain CSS. The kit supplies geometry, behavior, and `data-presentation-*` hooks, with no default visual theme.

After editing the canonical kit or shared browser scripts, run `node scripts/sync-templates.mjs` and the materialization test to keep the distributable snapshot byte-aligned. The root configuration enables normative reference validation; a fresh bootstrap instead verifies its configured example route. Add presentations with independent folders and explicit lazy registry entries.

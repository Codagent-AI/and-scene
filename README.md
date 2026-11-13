# And Scene

A browser presentation is one evolving diagram: stable entities, named beats,
and a fixed canvas. The reusable React kit owns motion, navigation and geometry;
each presentation owns its visual design.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
npm test
npm run lint
npm run build
npm run verify
npm run inspect -- how-to-make-a-presentation
```

Open `/` for the explicit registry, or `/how-to-make-a-presentation` for the
nine-step reference. Arrow keys, Space and PageUp/PageDown navigate; P toggles
browse/present mode. Touch swipes and browse controls also navigate. Focused
controls keep their own keyboard behavior.

Use [the presentation skill](skills/presentation/SKILL.md) to create or modify a
presentation. Its portable bootstrap includes a complete, style-neutral app,
locked dependencies, the byte-aligned scene kit and project-local verification
and inspection scripts. The presentation starter shows typed grouped payloads.

`npm run verify` builds the whole app and checks the canonical sample metadata
and every step in Chromium against an IPv4 production preview. Any build,
console, page or transition error fails with a phase/step and non-zero exit.
`node scripts/verify.mjs <slug>` instead checks a generated registered route.

The inspection helper writes settled desktop screenshots and an advisory report
to `artifacts/inspection/<slug>/`. Warnings identify visible text collisions,
indistinct active chrome and unpolished attribution. Mark only intentional
readable overlap subtrees with `data-presentation-allow-overlap`. Visual review
still belongs to the author; diagnostics do not establish aesthetic correctness.
Generated artifacts, dependencies and build output are ignored by Git.

Automated tests include focused unit/component/type contracts, INT-001 portable
bootstrap materialization, INT-002 controlled screenshot diagnostics, and the
E2E-001/E2E-002 production success/fault journeys. Browser tests use isolated
copies and clean up previews, browsers and temporary directories. There is no
hosted CI or publication workflow.

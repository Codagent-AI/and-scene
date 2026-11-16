# And Scene

A browser presentation is one evolving diagram: stable entities, named beats,
continuous motion, and two ways to follow the story.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/how-to-make-a-presentation` for the nine-step reference presentation.
The landing page lists the explicit registry in `src/presentations/index.ts`.
Arrow keys, Space and PageDown/PageUp navigate; P toggles present/browse.
Horizontal swipes and browse controls work too. Focused controls retain their keys.

```sh
npm test                  # fast Vitest contracts and components
npm run test:integration  # INT-001/002 and E2E-001/002, including fault injection
npm run lint
npm run build
npm run verify            # builds and renders all nine canonical steps
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --narrow
```

The inspection helper writes settled screenshots and an advisory warning manifest
to `artifacts/inspection/<slug>/<width>x<height>/`. Warnings and screenshots are
review aids, not a visual-quality pass/fail test. Generated artifacts are ignored.
All browser automation uses `127.0.0.1` and cleans up its preview and Chromium.

Use `skills/presentation/SKILL.md` to create or modify presentations. Install the
whole `skills/presentation/` directory together: its templates resolve relative
to the skill. The relocatable bootstrap helper refuses nonempty targets; the
skill explains confirmed selective merging, monorepo targets, contract detection,
and preservation of existing presentations.

The kit owns behavior and geometry, with **zero visual defaults**. Author colors,
fonts, borders, active states, controls, and attribution in presentation-local
plain CSS or host styles. Use `data-presentation-*` hooks. The sample's styling
is local; the bootstrap's reference route intentionally has no theme.

After editing the kit or browser scripts, run `node scripts/sync-templates.mjs`.
The bootstrap kit and browser scripts must remain byte-aligned with canonical
source. `INT-001` enforces parity while independently installing, building, and
verifying the materialized bootstrap. There is no hosted CI configuration.

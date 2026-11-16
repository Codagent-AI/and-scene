# And Scene

Browser presentations built as one evolving diagram, using React, TypeScript,
and Motion. The scene kit owns geometry and interaction; each presentation owns
its visual design.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Open `/how-to-make-a-presentation` for the nine-beat reference, or `/` for the
explicit presentation registry.

```sh
npm test                   # fast Vitest unit/component contracts
npm run test:integration   # materialized bootstrap and production browser tests
npm run lint
npm run build
npm run verify             # build and all reference steps in Chromium
npm run inspect -- how-to-make-a-presentation
```

Inspection writes settled screenshots and advisory diagnostics beneath
`artifacts/inspection/<slug>/<viewport>/`; add `--narrow` for 390 × 844 captures.
Advisories support visual review and do not score visual taste.

Use `skills/presentation/SKILL.md` to create or modify a presentation. Its resources
resolve relative to the installed skill, including a complete neutral bootstrap.
Create a folder with `entities.ts`, `steps/`, `Talk.tsx`, and presentation-local
CSS, then add an explicit lazy entry in `src/presentations/index.ts`.

The fixed default canvas is 880 × 380. Share Scene and groupKey between adjacent
beats to preserve component instances and stable layout IDs. Keep newcomers keyed
inside AnimatePresence; Appear delays entry until layout motion settles.

Keyboard: Right/Space/PageDown advance, Left/PageUp go back, P switches mode.
Controls retain their own keys. Horizontal swipe and browse controls also navigate.
Style `data-presentation-*` hooks locally, including active progress/sections and
bottom-right attribution. The reusable kit has no palette, font, or control theme.

When changing the kit or scripts, update their byte-identical bootstrap copies.
Generated builds, dependencies, and inspection artifacts are ignored and must not
be committed. No deployment or hosted CI is configured.

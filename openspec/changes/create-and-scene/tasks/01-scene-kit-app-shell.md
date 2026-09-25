# Task: Scene kit + app shell

## Goal

Build the reusable presentation engine (the scene kit) and the app shell it runs
in: implement the generic kit under `src/presentation-kit/`, a zero-dependency
pathname router, a `Landing` page that replaces the placeholder `App.tsx`, and an
explicit presentation registry. The kit must provide the complete evolving-scene
runtime contract without imposing presentation styling.

## Required reading

Before starting, read:

- `openspec/changes/create-and-scene/specs/evolving-scene-presentations/spec.md`
  — the authoritative behavioral contract
- `openspec/changes/create-and-scene/design.md` — architecture and boundaries
- `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `src/index.css`, and
  `package.json` — the starting scaffold

The sibling `codagent-dot-dev` presentation harness may be used as a behavioral
reference for motion, fixed-canvas layout, navigation, and modes. Do not copy its
talk-specific entities or visual styling into the reusable kit.

## Implementation

- Keep `Step<TPayload>`, `SceneProps<TPayload>`, and `Presentation<TPayload>`
  generic so strongly typed grouped payloads reach the presentation boundary
  without casts.
- Implement stable grouped scenes, layout projection for continuing entities,
  newcomer timing after persisting motion settles, and departing-entity exits.
- Implement present/browse modes, keyboard/touch/direct navigation, end clamping,
  focused-control behavior, and uniform fixed-canvas fit scaling at 880 × 380.
- Expose stable class/data hooks throughout the primitives and chrome. The kit
  provides no palette, fonts, borders, shadows, card/button treatments, spacing
  scale, theme tokens, Tailwind dependency, or other visual defaults.
- Expose semantic active state and stable active hooks on both progress and
  table-of-contents controls.
- Render the default bottom-right `made by and-scene` GitHub attribution with a
  stable hook. Do not render default top-left and-scene branding.
- Expose `data-step-count` and `data-step-index` so external verification can
  enumerate steps without coupling to private DOM structure.
- Add an explicit presentation registry, a pathname router, and a landing page
  that enumerates registered presentations.

## Acceptance criteria

The canonical scenarios in
`openspec/changes/create-and-scene/specs/evolving-scene-presentations/spec.md`
are authoritative. This task deliberately does not duplicate that spec; copied
acceptance criteria drifted in an earlier fixture revision.

## Done When

`npm run build` and `npm run lint` pass. Focused tests cover the typed payload
boundary, style ownership boundary, attribution, active navigation semantics,
navigation boundaries, modes, and core scene continuity. The router resolves the
landing page and registered presentation routes, and all canonical scenarios that
can be exercised before a real presentation exists pass.

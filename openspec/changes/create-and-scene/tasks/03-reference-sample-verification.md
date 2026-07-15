# Task: Reference sample via the skill + verification

## Goal

Produce the committed reference presentation, **How to Use This Skill to Make a
Presentation**, by loading and following the presentation skill's own procedure.
Then add `npm run verify`, which builds the whole app and renders the sample
through every step in a production browser.

## Required reading

Before starting, read:

- `skills/presentation/SKILL.md` and its templates — follow this procedure as if
  the skill were installed; do not improvise a separate generation process
- `openspec/changes/create-and-scene/specs/presentation-verification/spec.md` —
  the authoritative nine-step outline and verification contract
- `openspec/changes/create-and-scene/design.md` — verification and scene
  composition guidance
- all of `src/presentation-kit/`, plus `src/presentations/index.ts`,
  `src/main.tsx`, and `package.json`

Use the canonical table's topic, era, title, caption, and scene content as the
answers to the skill's gathering questions. The visual design is yours to create.
The result is one continuously evolving scene: existing entities remain in place,
step cards accumulate, and later connections and the reveal frame build on what is
already visible.

If dogfooding exposes a genuine gap in the skill, templates, or kit, fix that gap
instead of working around it.

## Verification

Add a `scripts/verify.mjs` invoked by `npm run verify` that:

1. Builds the whole application and fails on any type or build error.
2. Requires the registered nine-step reference sample in canonical order.
3. Starts `vite preview` and uses `127.0.0.1` consistently for the host,
   readiness probe, and browser URLs.
4. Uses Playwright/Chromium to enumerate and render every step from the
   `data-step-count` and `data-step-index` hooks.
5. Fails with the offending step on console errors, uncaught page errors, or a
   failed transition, and reports an unambiguous process-level outcome.

The project-local screenshot helper must capture every step after animations
settle and emit advisory warnings for:

- unmarked visible text/chrome overlap, with an explicit allow-overlap marker for
  intentional composition
- visually indistinct active progress or table-of-contents state
- missing, browser-default, or undersized attribution

## Acceptance criteria

The canonical scenarios and nine-step outline in
`openspec/changes/create-and-scene/specs/presentation-verification/spec.md` are
authoritative. This task deliberately does not duplicate that spec.

## Done When

The sample exists under
`src/presentations/how-to-make-a-presentation/`, is registered, and implements all
nine canonical steps in order as one continuously accumulating scene.
`npm run verify` builds and renders every step on `127.0.0.1`, returning nonzero
with a useful failure when any required check fails. The project-local screenshot
helper implements every canonical advisory check.

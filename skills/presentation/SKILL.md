---
name: presentation
description: Creates and modifies browser presentations as one evolving scene. Activates for requests to create a browser presentation, animate a diagram through steps, or edit an existing scene presentation.
---

# Presentation skill

Use this skill to create or modify a routed browser presentation. A presentation
is one diagram that evolves through named steps: entities keep stable IDs,
continuing entities morph in place, and each step owns its narrative caption and
visual intent.

## Out of scope

This skill creates browser-based presentations only. It does not export
PowerPoint, Keynote, PDF, image, or video decks. Redirect those requests to an
appropriate document, slide-authoring, or video workflow instead of pretending
that the browser artifact is an export.

## Gather requirements one question at a time

For a new presentation, ask only the next missing question, waiting for the
answer before asking another:

1. What is the topic and working title?
2. What visual direction should the presentation use (mood, palette,
   typography, density, and any references)?
3. For each step, what are its title, caption, narrative beat, and visual
   description? Ask for the next step only after the previous answer.

Do not invent details the user can still provide. If the user gives enough to
start, ask whether to proceed with the captured partial outline; partial detail
is an explicit, supported input, not a completeness failure. For a key or
complex composition, an ASCII sketch can clarify placement, but use it
selectively. Record stable entity names and reuse them across steps.

For a modification, identify the target first. If the request is ambiguous,
list the registered presentations and ask which one to change. Once selected,
ask only about the requested step, entity, or style change; do not repeat the
full creation interview.

## Resolve the project and bootstrap missing infrastructure

Run these checks from the intended project root. The three contract anchors are:

- build: `package.json` has a working Vite React TypeScript build and the
  `vite.config.*`/TypeScript entry points;
- scene kit: a `presentation-kit` containing the `Step`/`Scene` contract, stage,
  navigation, chrome, and fit-scale canvas;
- presentation index: a registry mapping slugs to lazy presentation entries.

Detect anchors by contract, not by exact filenames or bytes. Reuse every anchor
that exists and scaffold only what is missing. Resolve templates relative to this
file (`templates/bootstrap/`, `templates/presentation/`), never relative to the
agent's current working directory.

Target selection:

- Empty or standalone project: scaffold at its root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or an
  `apps/`/`packages/` layout): scaffold a self-contained app in `presentations/`.
- Already inside a presentation app: use that app and add only missing anchors.
- Non-empty project with no kit or index: state the target path and wait for
  confirmation before writing there.

When bootstrapping, copy the relevant templates and ensure these dependencies
are declared and installed: `react`, `react-dom`, `motion`, `lucide-react`,
`vite`, `@vitejs/plugin-react`, TypeScript and its React/DOM/Node types, the
ESLint stack, and `playwright`. Do not add Tailwind or another styling
framework unless the host already uses it or the user explicitly asks for it.
The reusable kit must remain free of palette, font, spacing, border, shadow,
card/button, and theme defaults. Put visual design in the presentation's CSS or
host CSS.

## Create or modify

Before editing an existing presentation, read its `Talk.tsx`, `entities.ts`,
relevant `steps/` files, presentation-owned styles, the presentation registry,
and the scene-kit types. Identify and preserve the existing import structure,
component patterns, entity naming namespace, and styling conventions. For a new
presentation, read the kit types and the selected templates before writing.

Create each new presentation in its own directory with `entities.ts`, a
`steps/` directory, and `Talk.tsx`; add one explicit lazy entry to the registry.
Use the templates as a starting point, preserve existing presentations, and
scope modifications to the selected directory plus the required registry line.
Give every entity a stable namespaced identity, keep the fixed 880 × 380 scene
canvas in mind, and use the kit primitives with presentation-owned classes.
Every step needs a title, caption, era, scene, and payload. Captions should
explain the beat in browse mode; present mode should remain concise.

Entities that persist across steps keep their `entityId` and morph in place on
their own. Wrap each entity a step *introduces* in `Appear` so newcomers fade in
only after the persisting entities have finished moving; an unwrapped newcomer
pops in on top of an in-flight morph.

## Verify before reporting success

Before claiming completion, run the project's build, then render the first step
in a real browser and check for console/page errors. Prefer the project-local
`scripts/inspect-presentation.mjs` helper; otherwise create a temporary helper
under the project root. Inspect settled screenshots of the first, last, and
dense/key steps, and use a narrow viewport when the composition is responsive-
sensitive. Run `npm run verify` when available for the full multi-step check.

Review every advisory from the screenshot helper. Fix accidental text/chrome
collisions, indistinct active progress or table-of-contents state, and missing,
browser-default, or undersized attribution. Mark only a readable intentional
overlap with the helper's explicit allow-overlap attribute. Re-run build,
render, and inspection after fixes. Report the target route, checks run, and any
remaining advisory warnings accurately.

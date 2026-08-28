---
name: presentation
description: Creates or modifies browser-based presentations as one evolving scene. Use when a user asks for a presentation, deck, talk, or diagrammatic story in a React project.
---

# And Scene presentations

Create browser presentations as a single, evolving diagram. A presentation is
not a collection of independent slides: stable entities keep stable IDs and
move between ordered scene states.

## Resolve the skill files first

Set `SKILL_DIR` to the directory containing this `SKILL.md`. Every template
path in this procedure is relative to `SKILL_DIR`, never the caller's current
working directory:

```text
SKILL_DIR/
  templates/bootstrap/       # complete standalone app snapshot
  templates/presentation/    # new-presentation folder template
  templates/step.tsx         # one-step reference template
```

This matters when the skill is installed globally or invoked from a nested
workspace. Do not look for templates through relative paths from the project.

## 1. Identify the operation and gather only what is needed

First decide whether the request is to create a presentation or modify one.

For **create**, ask one question at a time. Start with the topic if it is not
already known, then visual direction, then each story beat's content and visual
intent. A complete question can be: “What should the first step say, and what
should visibly change in the scene?” Do not infer information the user can
still provide. If a layout is consequential or hard to describe, offer one
small ASCII mockup for that step before building; do not make ASCII mockups a
ceremony for every step.

The user controls the amount of detail. If they explicitly say to proceed with
partial detail, record what is known, state the assumptions that are now needed,
and build rather than imposing a completeness gate. If topic, style, and steps
are already complete in the request, proceed without redundant questions.

For **modify**, inspect the presentation registry first. If the target is not
named or multiple entries could match, list the candidate slugs and titles and
ask which one to change before touching files. Once identified, ask only about
the requested step, entities, or styling change; do not repeat the full create
interview.

## 2. Resolve the project target and the three anchors

Inspect the target project before writing. The required anchors are:

1. **Build setup:** Vite + React + TypeScript with a working `npm run build`.
2. **Scene kit:** `src/presentation-kit/` with the typed `Step`/`Scene`
   contract, stage, navigation, chrome, fit canvas, and generic primitives.
3. **Presentation index:** an explicit `src/presentations/index.ts` registry
   that maps a route slug to each presentation loader.

Detect these at the contract level. Do not re-scaffold just because file
formatting, package versions, or extra dependencies differ. Reuse all anchors
that are present; scaffold only missing ones.

Choose the target as follows:

- An empty directory or standalone project uses its root.
- A monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or an
  `apps/` or `packages/` layout) uses a self-contained `presentations/` app.
- A project already containing the anchors is its own target, even if it is
  nested inside a monorepo.

For a non-empty project that is missing any anchor, state the exact target
directory and wait for confirmation before writing. Preserve unrelated root
content and an existing build setup. Never overwrite existing presentations.

## 3. Scaffold missing infrastructure

Copy the needed files from `SKILL_DIR/templates/bootstrap/` to the resolved
target. For a full scaffold, copy the complete snapshot. For a partial
scaffold, copy only absent anchors and their direct build wiring; merge the
registry rather than replacing it. The bootstrap snapshot contains a harmless
`starter` route so its own build and browser checks have a route to open.

Install dependencies from the target's manifest and lockfile. The scaffold must
ensure all of these are available; do not assume they were pre-installed:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`
- Build and types: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`
- Quality and render checks: ESLint stack and `playwright`

Use `npm ci` when a compatible lockfile is present, otherwise install and create
one. Do not add Tailwind, a Tailwind Vite plugin, or another styling framework
unless the host already uses it or the user explicitly asks. The scene kit must
remain style-neutral: it owns motion and geometry, not colors, fonts, spacing
scales, borders, shadows, card/button treatment, or theme tokens.

## 4. Create or change a presentation

For a new presentation, make `src/presentations/<slug>/` as a self-contained
unit. Use `templates/presentation/` as the starting shape:

- `entities.ts` defines a presentation-local, namespaced stable `layoutId` for
  every persistent box, label, arrow, frame, or emphasis marker.
- `steps/index.tsx` declares an ordered, typed `Step<TPayload>[]`. Give every
  step an id, era, one-line present title, browse caption, scene component, and
  payload. Use a shared `groupKey` for adjacent beats in the same evolving
  diagram.
- `Talk.tsx` imports `Presentation`, the steps, and local `presentation.css`.
- `presentation.css` owns the complete visual direction, including readable
  attribution and visibly distinct active progress/table-of-contents controls.

Compose the generic kit (`SceneLayer`, `Box`, `Label`, `Arrow`, `Frame`,
`Emphasis`, `SymbolChip`, and `Appear`) or raw motion elements with stable
`layoutId`s. Continue entities between steps instead of redrawing them.
Use `Appear` only for newcomers after existing entities settle. Add a route to
the explicit presentation registry without changing existing entries. Default
to plain presentation-local CSS.

For a modification, change only the selected presentation plus the minimum
registry or verification artifacts genuinely required. Keep the existing route
and all other presentation folders intact.

## 5. Verify, inspect, and repair before completion

Never report success on a failed check.

1. Run `npm run build` in the app target and fix type or bundling errors.
2. Run the local browser check for the generated route:
   `npm run render:smoke -- <slug>`. It opens a production preview at
   `127.0.0.1` and must have no console or page errors. When the completed
   project offers `npm run verify`, run `npm run verify -- <slug>` too; it is
   the full every-step gate for that presentation.
3. Prefer the project-local helper: `npm run inspect -- <slug>`. It captures
   settled screenshots under the project artifact directory. Inspect the first,
   last, and densest/key steps; inspect a narrow viewport too if the composition
   is responsive-sensitive. Use the local helper rather than an ad hoc helper
   outside the project tree.
4. Treat overlap, indistinct-active-chrome, and attribution diagnostics as work
   to review. Fix accidental collisions, make current controls distinct, and
   style the attribution locally. Mark only deliberate, readable compositions
   with `data-presentation-allow-overlap="true"`; never use that marker to hide
   an accidental collision.
5. Re-run every failed check after repair.

Report completion only after the build, route render, and composition review are
clean. Use this exact structure:

```text
Presentation folder: <path>
Route: /<slug>
Build: pass | fail
Route render: pass | fail
Full verification: pass | fail | not available
Inspected steps/viewports: <first, last, dense steps and widths>
Remaining warnings: none | <step-specific advisory warnings>
```

## Out of scope

This skill creates React browser presentations that use the included evolving
scene kit. It does not create PowerPoint, Keynote, PDF, video, or image exports;
use a dedicated export or document-generation workflow for those deliverables.
It also does not create conventional independent-slide decks: use a slide/deck
workflow when entity continuity is not wanted. Requests for a standalone image,
logo, or illustration should use an image-generation workflow instead of this
skill. It does not replace unrelated diagram editors or visual-design systems.

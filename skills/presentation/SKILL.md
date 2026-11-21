---
name: presentation
description: Create or modify a browser presentation that explains an idea through one evolving diagram.
---

# Presentation

## Gather the request

For a new presentation, gather the topic, visual style, and content and visual
description of each step. Ask about missing information one question at a time
and use details already supplied. With a complete request, proceed to the build.
The user controls the level of detail. If they explicitly choose to proceed with
partial detail, build from what they provided and invite iteration within the
presentation workflow. A concise ASCII diagram can confirm the layout of a key
or complex step when useful.

For a modification, identify the target from the presentation registry. If it
is unspecified or ambiguous, list the existing presentations and ask which one
to modify before editing. Ask only about the changes requested, such as changed
steps, entities, or styling.

## Resolve the app and its anchors

Before making changes, locate a Vite, React, and TypeScript app with a working
`npm run build`, the reusable scene kit, and the presentation registry that
maps presentations to independent routes. The kit provides the typed
Step/Scene contract, stage and morphs, modes and chrome, and fixed-canvas
scaling. Detect behavior and capabilities. File names, formatting, and extra
dependencies can differ from the templates.

Resolve the target before classifying its anchors. If you are already inside a
presentation app with all three anchors, use that app. Otherwise, target the
root of a standalone or empty project. For a monorepo, target a self-contained
app under the monorepo's `presentations/` directory. Workspace settings in
package.json, a pnpm workspace declaration, or a workspace-oriented
`packages/` or `apps/` layout can identify a monorepo.

Count anchors in the resolved app only. A build at the monorepo root does not
count toward the `presentations/` app. If that app does not yet exist, use the
complete bootstrap there and preserve the root build and unrelated files. If
the nested app is partial, fill only its missing anchors inside that app.
In a non-empty project that needs scaffolding, state the resolved target and
what you will add, then wait for confirmation before writing.

Resolve `templates/bootstrap/` and `templates/presentation/` from this
`SKILL.md` directory, independent of the user's working directory. If using
the command line, run the `templates.mjs` adjacent to this file by its absolute
path to print both absolute template paths.

- With all three anchors present, proceed with the presentation request using
  the app's conventions.
- With no anchors in an empty target, copy the bootstrap tree into the target.
  In a populated unscaffolded target, integrate those same three anchors while
  preserving unrelated files and settings.
- In a partial target app, copy the scene kit only if it is missing. Add the registry
  and minimal route integration only if the index anchor is missing. Add or
  extend build files only as needed for a missing build anchor. Preserve
  working anchors and unrelated monorepo content. The bootstrap's registered
  starter illustrates how the build, registry, and kit connect.
- Install the missing dependencies required by the anchors. Use `npm ci`
  for the copied package manifest and lockfile in a fresh app. In a partial
  app, merge the required dependencies and scripts into its existing package
  setup and install using its package workflow. The bootstrap manifest lists
  React, React DOM, Motion, Lucide, Vite and its React plugin, TypeScript,
  React/DOM/Node types, ESLint tooling, and Playwright. Add any missing local
  verification and inspection scripts so they resolve from the app. Install
  Playwright Chromium if it is unavailable.
- Keep bootstrapping styling-framework-neutral and free of presentation
  colors, fonts, spacing scales, themes, cards, buttons, borders, or shadows.
  Host styles belong to the host. Preserve existing presentation routes.

## Create or edit the scene

For a new presentation, copy the presentation template to a dedicated folder
under `src/presentations/` or the host's equivalent. Choose a unique
lowercase, hyphen-separated route slug, make the entity IDs specific to that
presentation, and add one entry to the explicit registry with its slug, title,
and lazy import of `Talk.tsx`. Preserve each existing registry entry, route,
and presentation. For a modification, update the selected presentation and
only any registration or verification data required by that edit.

Use ordered typed steps with stable IDs, an era, a one-line presenter title, a
browse caption, and the diagram state. Compose the states on one fixed
canvas with stable IDs for continuing entities. For adjacent grouped beats
use the same Scene and group key, changing its typed payload. Keep continuing
entities mounted with layout identity and no replayed entry fade. Give new
entities delayed entry, and let removed entities exit through presence.
Preserve readable intentional layering. Use primitive hooks or raw Motion
elements with stable layout IDs where a shape calls for them. A presentation
can select its opening mode.

Put visual treatments in presentation-owned or host-owned files. Use plain
CSS unless the host already uses another framework or the user requests one.
Use the kit's stable hooks to make current progress and the current table of
contents entry visibly distinct, give controls a designed treatment, and
make the bottom-right GitHub attribution legible.

## Verify, fix, and recheck

1. Run the app's whole-project build and check for type and build errors.
2. Render the target route in a browser with zero runtime or console errors
   on its first step at minimum. Prefer the full local render check, for
   example `npm run verify -- <slug>` with this scaffold. Check that steps
   expose captions and next and previous navigation in browse mode.
3. Review settled browser captures of the first, last, and any dense or key
   steps. Include a narrow viewport for responsive-sensitive compositions.
   Prefer the project-local helper (`npm run inspect -- <slug>` and, as
   applicable, `--viewport=390x844`). If it is unavailable, put any temporary
   Playwright helper under the project root and wait for motion to settle.
4. Use the captures to confirm that important content fits the fixed canvas,
   intentional overlap remains readable, progress and the active era are
   distinct, attribution is legible, and scene content clears the caption,
   progress, table of contents, and navigation controls. Review every warning
   at its referenced step. Fix accidental collisions and missing or unpolished
   chrome. Mark only a readable, intentional overlap with
   `data-presentation-allow-overlap` on the common subtree.
5. Fix build, render, and composition failures within the app. Rerun affected
   checks and review fresh captures before reporting completion. Report the
   route, final checks, and any remaining advisory status accurately.

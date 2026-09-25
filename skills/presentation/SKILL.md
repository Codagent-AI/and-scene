---
name: presentation
description: Create or modify browser presentations as one evolving, navigable scene. Use when a user asks for a presentation, talk, or changes to an existing presentation.
---

# Presentation skill

Create a browser-based presentation as one diagrammatic scene that changes
through named steps. The scene kit owns behavior and geometry; each presentation
owns its visual design. The generated artifact is called a **presentation**.

## 1. Understand the request

Decide whether the request is to create a presentation or modify an existing
one. Use details already supplied; do not repeat questions that have already
been answered. If essential details are missing, ask one short question at a
time, in this order:

1. What is the topic and intended audience or outcome?
2. What visual direction should it use (or should you propose one)?
3. What should each step explain, and what should the viewer see in that scene?

For step details, gather one step at a time. Ask about both its message and
visual intent. Offer an outline when the user has not specified step count. Do
not silently invent details the user could still provide. The user controls the
depth: explicitly offer to start with partial information and iterate. If they
choose that option, record what remains open and make only the minimum
reasonable choices needed to build. A concise ASCII sketch can help confirm a
particularly important or complex composition; use it selectively.

For a modification, identify the target presentation before editing. If the
target is missing or ambiguous, list registered presentations by title and
route, then ask which one. Ask only about the requested change; do not repeat
the full creation interview. Preserve unrelated presentations and files.

## 2. Resolve the app and scaffold target

Find this skill's directory from the location of this `SKILL.md`, then resolve
all assets from that directory (for example,
`<skill-dir>/templates/bootstrap/`). Never find templates relative to the
agent's current working directory.

Check the project contract, not exact filenames or byte identity. Detect these
three anchors independently:

- **Build setup:** a Vite + React + TypeScript app with a working build script.
- **Scene kit:** an equivalent `Step`/`Scene` contract, scene stage with entity
  transitions, present/browse navigation, chrome, and fit-scaled canvas.
- **Presentation index:** an explicit or equivalent registry that maps
  presentations to distinct routes.

Cosmetic differences and extra dependencies do not mean an anchor is missing.
Reuse every valid anchor. For a partial scaffold, add only missing anchors and
their supporting files; do not overwrite existing app configuration, kit,
registry, or presentations. Integrate missing files with the existing
architecture and preserve existing entries.

Resolve the target as follows:

- Empty directory or standalone project: app root.
- Monorepo (workspace declaration, `pnpm-workspace.yaml`, or a `packages/` or
  `apps/` layout): a self-contained app under `presentations/` (use
  `presentations/and-scene/` if there is no established convention).
- Already inside an app with all three anchors: use that app.

If a non-empty project lacks required anchors, state the proposed target and
what will be added, and get confirmation before writing. This confirmation is
about the target and scaffold only; do not ask again after it is confirmed. If
the user declines, stop writes and offer a target inside an empty directory.

For a full scaffold, copy the *contents* of `templates/bootstrap/` to the
resolved app root. For a partial scaffold, copy/select only missing pieces and
merge registry changes carefully. The snapshot's `src/presentation-kit/` is the
reference implementation for an unscaffolded app. Do not replace a different
but contract-complete kit with the snapshot.

## 3. Ensure dependencies

Scaffolding must ensure all dependencies are declared and installed; do not
assume a dependency exists just because some files do. Runtime dependencies:
`react`, `react-dom`, `motion`, and `lucide-react`. Build and quality tools:
`vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
`@types/react-dom`, `@types/node`, ESLint and its configured plugins, and
`@playwright/test` for browser render/inspection. Use the host's package manager
and lockfile, update its lock data, then install. Reuse declared compatible
versions. Do not add Tailwind, a Tailwind plugin, or another styling framework
unless the host already uses it or the user asks for it. Do not put presentation
colors, fonts, spacing scales, borders, shadows, card/button styles, or theme
tokens in the reusable kit or neutral bootstrap CSS.

## 4. Create or modify the presentation

For a new presentation, choose a URL-safe unique slug and create a self-contained
directory below the app's `src/presentations/`. Start from
`templates/presentation/` and `templates/step/`, resolving both relative to this
skill. Replace every placeholder. Create presentation-local entities with
stable IDs and one ordered `Step` per narrative beat. Each step needs a stable
`id`, `era`, `title`, `caption`, `payload`, and `scene`, following the host kit's
types. Use stable IDs for entities that persist across steps so layout
projection can express continuity. Group steps only when their scene component
should persist and update through its typed payload. Compose generic kit nodes;
keep scene-specific labels, positions, decorations, and CSS in the presentation.
Give every step a useful caption and support a coherent beginning-to-end story.

Add one explicit registry entry for the new slug and lazy-loaded presentation.
Do not remove, reorder, or rewrite existing entries unnecessarily. For a
modification, change only the selected presentation and required registry or
host integration. Keep styling in that presentation's CSS (plain CSS by
default), or in existing host-owned styles when explicitly appropriate.

The shared kit is behavior and geometry only. Never add visual defaults to it
to make one presentation look right. Keep the fixed design canvas composition
readable, reserve room for chrome, visibly distinguish active navigation, and
make attribution legible. Mark overlap with
`data-presentation-allow-overlap` only when it is intentional and remains
readable.

## 5. Verify, inspect, and repair

Do not report completion until the checks pass. From the app root:

1. Run `npm run build` and fix type/build errors.
2. Run the project's render verification (`npm run verify` when available; the
   bootstrap template provides it). At minimum, load the new or modified route
   in Chromium and confirm its first step renders without console or runtime
   errors. Ensure the matching Playwright Chromium browser is available (the
   bootstrap README documents `npx playwright install chromium` when needed).
   Use `127.0.0.1` for local preview URLs.
3. Prefer the project-local `npm run inspect -- /<slug>` helper. It captures
   settled screenshots for every step and reports advisory text/chrome overlap,
   active-navigation contrast, and attribution warnings. Review every cited
   warning; fix accidental collisions, indistinct active state, and poor
   attribution, then inspect again. Retain an allow-overlap marker only for a
   deliberate readable overlap.
4. Visually inspect the first and last steps and each dense or key step. Check a
   narrow viewport too when the content or controls are responsive-sensitive.
   Confirm important content fits the fixed canvas and avoids captions, table
   of contents, progress, and navigation.

When no project-local helper exists, use the project's own Playwright setup and
write temporary inspection code and screenshots under the project root. Do not
use a helper outside the target project. If any build, render, or composition
check fails, repair the cause and repeat the affected checks. Report exact
commands and outcomes, the route, screenshot location, and any remaining
advisory warnings. Never describe an unrun check as passed.

## 6. Completion report

Summarize the created or modified presentation, its route, notable files, and
verification evidence. State any remaining advisory warning plainly. If the
user chose partial detail, mention the consequential assumptions that were
needed so they can guide a later iteration.

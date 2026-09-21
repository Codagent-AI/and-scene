---
name: presentation
description: Creates and modifies browser presentations as evolving scenes. Activates for requests to create a browser presentation, animate a diagram across story beats, or edit an existing scene-based talk.
---

# Presentation skill

Create a browser-based presentation from a topic. A presentation is one
evolving diagram: named steps change a shared scene, while the presentation
kit supplies navigation, motion, and chrome.

## Out of scope

This skill does not edit PowerPoint or Keynote files and does not export PDF,
video, or image decks. Redirect those requests to the appropriate office,
document, or media tools.

## Gather requirements

Ask one question at a time. Do not fill in details the user can still provide.

1. Ask for the topic or title.
2. Ask for the visual direction: palette, typography, mood, density, and any
   references.
3. Ask for the story beats. For each step, collect its section/era, title,
   caption, entities and their relationships, and the intended visual change.
4. If a complex layout would benefit from confirmation, show a small ASCII
   mockup. Do this selectively, not for every step.

The user may explicitly choose to proceed with partial detail. In that case,
use only the captured requirements, make conservative placeholders for details
that are genuinely absent, and leave the presentation easy to revise.

If the request is to modify an existing presentation, first identify the
target. When it is missing or ambiguous, list the registered presentations and
ask which one to change. Once selected, ask only about the requested steps,
entities, or style; do not repeat the create questionnaire.

## Resolve the project and bootstrap it

Resolve all paths relative to this file's directory, never relative to the
agent's current working directory:

```text
SKILL_DIR = directory containing this file
SKILL_DIR/templates/presentation
SKILL_DIR/templates/bootstrap
```

Inspect the project before writing. Detect these contract anchors rather than
matching a particular scaffold's formatting:

- build: `package.json` has Vite/React/TypeScript and a working `build` script;
- scene kit: a kit exporting `Step`/`Scene`, `Presentation`, and a stage host;
- presentation index: a registry mapping slugs to lazy presentation modules.

When all anchors exist, reuse them. When only some exist, add only the missing
anchors and their dependencies. In an empty or standalone project, target the
repository root. In a monorepo (workspaces, `pnpm-workspace.yaml`, or an
`apps/`/`packages/` layout), target a self-contained `presentations/` app.
For a non-empty unscaffolded project, state that target and obtain confirmation
before writing. Preserve unrelated files and existing presentations.

Materialize missing infrastructure from `templates/bootstrap` and resolve the
template paths from `SKILL_DIR`. Install the complete dependency contract:
React, React DOM, Vite, TypeScript, Motion, Lucide icons, ESLint, and
Playwright/Chromium render verification. Do not add Tailwind or another
styling framework unless the host already uses it or the user requests it.

The kit template must remain style-neutral: no palette, font, spacing scale,
border, shadow, card/button treatment, theme token, or CSS framework belongs in
the kit. Presentation-owned plain CSS is the default.

## Create or modify

Create each presentation in its own folder, with a `Talk.tsx` entry, typed
entities, ordered step files, and presentation-local CSS. Register exactly one
lazy route in the explicit presentation index. Never overwrite or restructure
other registered presentations.

Use stable entity IDs and a shared `groupKey` for successive states of one
scene. Keep the 880 × 380 fixed-canvas composition intentional; use the kit's
stable `data-presentation-*` hooks and `layoutId` primitives. Every step needs
an id, section, title, caption, payload, and scene. Derive visible numbering
from array order rather than storing manual numbers.

## Verify before reporting success

From the target app directory:

1. Run `npm run build` and fix all type/build failures.
2. Run the project's local verification or screenshot helper. At minimum,
   render the first step in a production browser and check console errors and
   uncaught page errors. Prefer `npm run verify` when available.
3. Inspect settled screenshots of the first, last, and densest/key steps; use a
   narrow viewport when the composition is responsive-sensitive.
4. Review warnings for accidental text/chrome overlap, indistinct active
   progress or table-of-contents state, and missing/default/undersized
   attribution. Fix accidental problems. Mark an overlap only with the
   explicit allow-overlap hook when it is intentional and readable.

Do not report completion while any build, render, or visual check is failing.
Use this compact completion report:

```text
Route: <local route or none>
Steps Checked: <count and representative steps, or none>
Commands and Results: <command> — PASS|FAIL|SKIPPED; ...
Advisory Warnings: <warning summary, or none>
```

Temporary browser processes and screenshots stay out of source control.

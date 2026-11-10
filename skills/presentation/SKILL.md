---
name: presentation
description: Create or modify browser presentations as one evolving scene, with self-bootstrapping infrastructure and production verification.
---

# Presentation

Resolve every template path relative to this SKILL.md directory. The sibling
`scaffold.mjs` uses its own module URL to find `templates/bootstrap/`, independent
of the current working directory. Read the target project instructions first.

## Gather or identify the target

For a new presentation, gather the topic, visual style, and the content and visual
description of each step. Ask for missing information one question at a time.
Avoid inventing details the user can still supply. If the user explicitly chooses
to proceed with partial detail, build from those details and iterate without a
completeness gate. A complete initial request can proceed directly. You may draw
an ASCII mockup for a complex or important layout when it helps confirm intent.

For a modification, identify the existing presentation before edits. If the target
is unclear, list registered presentations and ask which one to modify. Once it is
identified, ask only about the requested step, entity, or style changes. Edit that
presentation in scope and preserve the other presentations and their routes.

## Resolve infrastructure

Check contracts, rather than exact scaffold filenames or formatting.

- A Vite + React + TypeScript build setup with a working `npm run build`.
- A generic scene kit with typed steps, grouped scene persistence, stable entity
  morphs, delayed newcomers, exit animation, fixed-canvas fitting, modes, and chrome.
- An explicit presentation registry with individual lazy-loaded routes and a landing index.

If all anchors exist, reuse them. Cosmetic differences and extra dependencies do
not require regeneration. Add only missing anchors and dependencies in partial
projects, preserving existing infrastructure and unrelated content.

Use an existing presentation app when found. Otherwise, empty and standalone
projects scaffold at root. Monorepo signals include package.json workspaces,
pnpm-workspace.yaml, and packages/ or apps/ layouts. In a monorepo, scaffold a
self-contained app in `presentations/` and preserve the root build infrastructure.
For a non-empty project missing kit or index, state the resolved target and obtain
user confirmation before writing infrastructure.

The sibling `scaffold.mjs` is a conservative copying helper. After contract review,
invoke `node <absolute-skill-directory>/scaffold.mjs <project-root>` with
`--anchors=build,kit,index` listing only the anchors actually present, including
alternate file layouts. For a confirmed non-empty target, add `--confirmed`.
Its filename heuristics are hints, so review the contracts yourself. Existing files
are preserved. Reconcile missing imports, host route integration, and merged
package scripts as needed to make all three contracts work. If a preexisting
partial anchor needs completion, edit it deliberately rather than overwriting it.

Run `npm ci` when the supplied lock matches the package, otherwise `npm install`
to resolve the merged manifest and update its lock. Ensure react, react-dom,
motion, lucide-react, vite, @vitejs/plugin-react, typescript, @types/react,
@types/react-dom, @types/node, the full ESLint stack, and playwright are installed.
Install Chromium with `npx playwright install chromium` when absent. No dependency
may be assumed to exist. The bootstrap contains a neutral starter route and zero
presentation styling defaults. Use plain CSS by default. A framework is optional
when the host already uses one or the user explicitly requests one.

## Create or modify the scene

Use `templates/presentation/` as an authoring guide. Give each presentation its
own `src/presentations/<slug>/` folder with `Talk.tsx`, `entities.ts`, and `steps/`.
Register a new folder with one explicit `{ slug, title, load }` entry. Preserve all
other entries and files. Slugs should be unique lowercase words joined by hyphens.

Each step has an id, era, one-line presenter title, paragraph browse caption,
Scene component, and typed payload. Numbering follows array order. Render through
`<Presentation steps={steps} title={title} initialMode="browse" />`. Typed payloads
require no casts. Use the same Scene and groupKey for adjacent evolving beats.
Keep entity ids stable across steps. Continuing nodes morph through layoutId and
must not remount or repeat newcomer fades. Place newcomers in keyed Appear wrappers
inside AnimatePresence so entry follows layout motion and departure animates out.
SceneLayer prevents whole-layer reflow. Use literal coordinates in the 880 × 380
canvas. Raw motion elements with stable layoutIds are supported for custom shapes.
Preserve intentional readable overlaps and stacking. Avoid resetting the diagram
between steps or moving accumulated entities merely to fit an implementation pattern.

The kit owns behavior, geometry, and stable data-presentation-* hooks. Keep palette,
fonts, spacing, borders, shadows, cards, buttons, and theme tokens in presentation
or host CSS. Style the current progress and section hooks distinctly. Style
[data-presentation-attribution] legibly and intentionally. The kit defaults to a
bottom-right “made by and-scene” GitHub link. Top-left branding is host opt-in.

## Verify and repair before completion

Run `npm run build` for the whole application. Run `npm run verify -- <slug>` to
render the target through every step in production Chromium, including its first
step without console or runtime errors. Bare `npm run verify` checks the canonical
reference sample in this repository. Bootstrap's verify script defaults to starter,
so invoke `node scripts/verify.mjs <slug>` there for another presentation. Use
127.0.0.1 for preview, readiness probes, and browser navigation.

Use `npm run inspect -- <slug>` when available. The project-local helper resolves
local browser dependencies and captures every settled step under
`artifacts/inspection/<slug>/`. If it is unavailable, write any temporary Playwright
helper under the project root. Inspect first, last, and dense or key-step images
or equivalent browser views. Check a narrow viewport for responsive-sensitive
presentations. Review warnings at their referenced steps. Fix accidental collisions
with scene text, captions, progress, ToC, or controls. Keep content in the canvas,
make intentional overlaps readable, and mark only genuinely intentional overlap
subtrees with `data-presentation-allow-overlap`. Correct indistinct active navigation
and undersized or browser-default attribution in local CSS. Warnings are advisory
inspection artifacts and need review.

Fix build, render, and composition failures and rerun affected checks before saying
done. Confirm every step has a caption, next/previous work, and the result follows
the evolving-scene model. Report executed checks and any remaining advisory status
accurately. Do not report completion while functional or composition checks fail.

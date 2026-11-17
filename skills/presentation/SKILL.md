---
name: presentation
description: Create or modify a browser presentation as one evolving scene.
---

# Presentation

## Gather
Ask one question at a time for missing topic, visual direction, and each step's content and visual description. Do not assume details the user can provide. If the user chooses to proceed with partial details, build from what is known and iterate. If all details are already supplied, proceed. For a complex or key step, an ASCII sketch can help confirm the intended layout.

## Resolve and scaffold
Resolve all template paths relative to this SKILL.md, never the caller's current directory. Detect contract anchors: a working Vite/React/TypeScript build, a scene kit with step contract, stage, navigation, chrome and fit scaling, and a presentation route registry. Accept equivalent implementations; do not require identical filenames. If all anchors exist, reuse them. If some are missing, add only missing anchors and required dependencies without overwriting existing infrastructure. If none exist, copy the full `templates/bootstrap/` scaffold. A monorepo (workspace declarations, pnpm workspace, or packages/apps layout) gets a self-contained app in `presentations/`; a standalone project or empty directory uses its root. For a non-empty project missing the kit or index, state the proposed target and obtain confirmation before writing. Ensure React, React DOM, Motion, Lucide, Vite, React plugin, TypeScript and React/Node types, ESLint and Playwright are installed. Do not impose a styling framework or visual theme.

## Create or modify
For a new presentation create its own folder, entity IDs, ordered typed steps, entry component and presentation-owned plain CSS (unless an existing or requested framework applies). Register its route without disturbing other presentations. Compose an evolving scene with stable IDs and grouped payloads. For a modification, identify the target first; if ambiguous list existing presentations and ask which. Ask only about the requested changes and keep edits scoped.

## Verify
Run the build and render at least the first step, checking for runtime and console errors. Fix failures and rerun checks before reporting success. Use the project-local `npm run inspect -- <slug>` helper when available; otherwise put a temporary Playwright helper under the project root. Inspect settled screenshots or equivalent browser views of the first, last and dense/key steps, and a narrow viewport for responsive-sensitive presentations. Check canvas fit, readable overlaps and chrome collisions. Review helper warnings, repair accidental collisions, indistinct active progress or table-of-contents states, and unpolished attribution; mark only intentional readable overlaps as allowed. Put active chrome and attribution styling in presentation or host CSS. Run full multi-step verification before completion and report the results.

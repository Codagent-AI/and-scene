---
name: presentation
description: Create or modify browser presentations as one evolving diagram, with a reusable React scene kit and build/render verification.
---

# Presentation

Use this skill to turn a topic into a browser presentation or to change an existing presentation. A presentation is one evolving scene with stable entities across ordered named steps. It is not a stack of independent slide screenshots. The entry filename `Talk.tsx` is incidental; use “presentation” for the artifact.

## Locate resources

First resolve the absolute directory containing this `SKILL.md`; call it `SKILL_DIR`. Every resource below is relative to that directory, never the caller's current working directory:

- `SKILL_DIR/templates/bootstrap/`: self-contained Vite/React/TypeScript app and reusable scene kit.
- `SKILL_DIR/templates/presentation/`: authoring starting points.
- `SKILL_DIR/materialize-bootstrap.mjs`: safe full-bootstrap copy helper.

Use the installed skill's actual path, not a guessed `<project>/skills/` path. Copy resources into the resolved app and run all package commands from that app.

## Gather only what is missing

For creation, review the request and conversation for topic, intended audience, visual direction, and the content and visual description of each step. Ask one missing question at a time. Start with topic, then the look, then each beat's content and visual description. Do not invent information the user can still supply. The user controls depth: when they explicitly choose to build with partial detail, use what was captured and iterate without imposing a completeness gate. A request already containing topic, style, and all step details can proceed directly.

For a key or complex visual, an ASCII mockup can help confirm its composition. Use one when helpful rather than requiring a mockup for every step.

For modification, resolve the target first. If unspecified or ambiguous, enumerate the registry's existing presentations and ask which one to modify before changing files. Once identified, ask only questions needed for the requested steps, entities, or style change; do not repeat the full creation interview.

## Resolve the app and infrastructure

Inspect contracts rather than exact filenames, formatting, dependencies, or file hashes. Cosmetic differences must never trigger replacement. Locate three anchors:

1. A Vite + React + TypeScript build setup with a working whole-app `npm run build`.
2. A reusable scene kit with typed Step/Scene payloads, a mounting/morphing host, present/browse navigation and chrome, captions/ToC, and a fit-scaled fixed canvas.
3. A presentation registry plus routing that permits multiple independently reachable presentations.

If already inside a presentation app, reuse it; add only missing anchors. If all three are present, skip scaffolding completely. Do not replace a compatible host just because it has different names, formatting, or extra dependencies.

Otherwise resolve a scaffold target:

- An empty or standalone non-monorepo project uses its root.
- A monorepo signaled by package.json `workspaces`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` directory uses a self-contained app under `<monorepo>/presentations/`. Do not change the monorepo root build setup or unrelated workspace content.
- If that child already exists, inspect its anchors before writing. Preserve compatible infrastructure and existing presentations. Do not overwrite unrelated content at the target.

In a non-empty project lacking the scene kit or presentation index, state the exact target path and proposed missing infrastructure, then obtain user confirmation before writing. This applies to monorepos and partial scaffolds too. Existing session authorization of that exact action remains valid.

With no anchors, materialize the complete bootstrap snapshot. For an empty destination, run `node "$SKILL_DIR/materialize-bootstrap.mjs" <absolute-target>`. The helper refuses existing-file overwrites. With partial anchors, copy and adapt only missing infrastructure from the snapshot; merge required package scripts/dependencies without replacing existing package metadata, source, configuration, or registry entries. In a monorepo, an existing unrelated root build anchor is preserved while the child app receives its own complete build infrastructure.

Ensure the full dependency set rather than assuming it is installed:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build and types: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`.
- Lint: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`.
- Render verification: `playwright` and its Chromium browser. Keep the scaffold's declared lock data consistent with package changes. Use `npm ci` when it matches; otherwise install the needed dependencies and update the lockfile.

Do not add Tailwind, a Tailwind Vite plugin, or another styling framework unless the host already uses it or the user explicitly requests it. The scaffold and scene kit have zero presentation styling defaults: no colors, fonts, spacing scale, borders, shadows, card/button treatments, or CSS theme tokens. Canvas/chrome geometry and motion timing belong to the kit. The presentation or host owns every visual treatment.

## Create an evolving presentation

Choose a unique route slug and create `src/presentations/<slug>/`. Never overwrite another presentation. Copy the authoring templates relative to `SKILL_DIR`, remove their `.template` suffixes, and replace all `__...__` tokens. Templates are starting points, not finished content.

Create:

- `entities.ts`: a presentation-specific stable layoutId namespace.
- `steps/`: named ordered Step objects with id, era, one-line title, paragraph caption, Scene, typed payload, and optional groupKey.
- `Talk.tsx`: render the scene kit's `Presentation` with the step array, title, and chosen initial mode.
- Presentation-local plain CSS for the requested look (unless the host/user selected a framework).

For adjacent beats in one evolving diagram, share the same Scene component and groupKey, updating typed payloads in place. Keep continuing entities mounted with stable IDs so Motion can morph their position, dimensions, labels, and emphasis. Newcomers enter after continuing motion settles; departed entities exit: wrap a conditionally rendered entity as `<Appear show={condition}>` (or in your own `AnimatePresence`) so it stays mounted while it animates out. Use kit primitives where suitable and raw Motion elements with stable layoutId for custom shapes. Coordinate-heavy compositions and intentional readable overlaps are supported. Do not spread or rearrange entities merely to fit an implementation pattern. Use absolute SceneLayer geometry so mounting a layer cannot reflow its siblings.

Add one explicit registry entry `{ slug, title, load: () => import('./<slug>/Talk') }`; preserve every existing entry and route. Do not use wildcard registration. Check route collision before writing. A host may explicitly supply header branding; the kit has no default top-left brand. Style its default bottom-right “made by and-scene” attribution through its `data-presentation-attribution` hook.

Each step needs a caption, and the finished presentation needs next/previous and direct-jump controls, keyboard navigation, touch navigation, present/browse modes, and the fixed 880 × 380 canvas fit behavior. Derive numbering from step order rather than storing manual numbers.

## Modify in place

Inspect the identified presentation's current entities, step payloads, local styles, and registry entry. Make the requested scoped changes there. Preserve stable IDs and grouped scene instances wherever the story continues. Leave other presentation files and routes intact. Change shared infrastructure only when necessary to satisfy the requested change and explain that scope.

## Verify and repair before completion

Run the app's build and local render verification for the generated or modified route. At minimum render its first step in real Chromium without runtime or console errors. Use the scaffolded `npm run verify -- --slug <slug>` for a generated route; run `npm run verify` for the canonical reference gate when present. The latter checks every sample step and exact normative metadata. A failing build, render, or transition is unfinished work: fix it and rerun the affected check before saying done.

For visual composition review, prefer `npm run inspect -- <slug>`, the scaffolded project-local helper. It captures settled per-step screenshots from a production preview and reports advisory diagnostics using local dependencies. If unavailable, put any temporary Playwright helper inside the app root, never in an unrelated external directory. Serve and navigate consistently through `127.0.0.1`.

Inspect screenshots or an equivalent browser view of the first step, last step, and dense/key steps after animations settle. Also inspect a narrow viewport whenever responsive fit/readability is sensitive. Check important content fits the fixed canvas; intentional overlaps remain readable; and content does not collide with captions, progress, ToC, or navigation. Use the project's `chrome-devtools-axi` interactive interface when available, starting with a snapshot before screenshots. Do not treat advisory output alone as visual composition approval.

Review each helper warning against its referenced step. Repair accidental text/chrome collisions, indistinct active progress/ToC state, and illegible or browser-default attribution in presentation-owned or host-owned CSS. Mark only intentional readable overlaps with `data-presentation-allow-overlap` on the intended subtree. Never silence an accidental collision by marking an entire diagram exempt. Rerun affected checks and captures after repairs. Keep the kit free of visual defaults.

Report the created or modified route, scoped files, checks actually run, and any remaining advisory observations accurately. Do not report success until build, render, and visual composition checks pass. Stop preview processes when finished. Do not commit generated build output, dependency directories, or screenshots, and do not publish or deploy as part of this skill.

---
name: presentation
description: Create, add steps to, edit, or restyle browser presentations as one evolving animated diagram with the And Scene kit. Use when a user asks for a presentation, slides, deck, talk, explainer, or visual walkthrough, or wants to add, edit, or restyle steps in an existing presentation.
---

# Presentation skill

Create one evolving diagram, not a stack of unrelated slides. Stable entities persist between named steps; each step has its own title, caption, visual description, and scene state. The presentation owns its look. The reusable kit owns scene behavior and geometry.

Resolve every path below from the directory containing this `SKILL.md` (the skill directory), never from the caller's working directory. The bootstrap snapshot is `templates/bootstrap/`; the presentation starter is `templates/presentation/`.

## Out of scope

- For static slide decks or requests to author a native deck, use a slide-authoring skill or application such as Google Slides.
- For PPTX or PDF export, use a presentation or document export tool that supports that format.
- For non-Vite or non-React hosts, use the host's native presentation workflow or a skill for that framework.
- For changes to shared kit behavior, use the repository's implementation workflow and kit specifications; this skill creates presentations with the kit.

## 1. Read first

Before interviewing or editing, inspect the presentation registry and the worked example at `src/presentations/how-to-make-a-presentation/` when they exist. Read the example's `entities.ts`, every file in `steps/`, `presentation.css`, and `Talk.tsx`. When the worked example is unavailable, use the skill-relative `templates/presentation/` starter as the reference. For a modification, read the target presentation's `entities.ts`, `steps/`, `presentation.css`, and `Talk.tsx` before editing. Follow its naming, structure, and styling conventions while keeping the requested changes scoped to that presentation.

## 2. Gather the brief

Use the details already provided. Ask only for missing information, one question at a time:

1. Identify the topic or explanation.
2. Identify the visual style.
3. For each step in order, capture what it explains, what viewers should see, its title and caption, and which entities appear, persist, move, or leave.

Accept sketches, partial outlines, and requests to proceed with the available information. For an explicit partial brief, proceed with a minimal scaffold and record unknown details as placeholders; iterate from the result. Do not impose a completeness gate. Use an ASCII mockup selectively when a key or complex composition would benefit from confirming its layout.

## 3. Resolve the app target and scaffold

Inspect the intended project and detect these three contract anchors, regardless of filenames or formatting:

- **Build setup:** Vite + React + TypeScript with a working `npm run build`.
- **Scene kit:** a `Step`/`Scene` contract, active-scene host with entity morphs, present/browse navigation and chrome, and fit-scaled canvas.
- **Presentation index:** a registry mapping each presentation to its route.

If all anchors exist, use the app and preserve its conventions. If any are missing, resolve the target:

1. Use the project root for an empty directory or standalone project.
2. For a monorepo, use a self-contained app under `presentations/`. Treat a `workspaces` field in `package.json`, a `pnpm-workspace.yaml`, or a root `packages/` or `apps/` directory as monorepo signals.
3. When already inside an app with one or more anchors, complete only the missing infrastructure there.
4. In a non-empty project that needs scaffolding, state the exact target path and wait for confirmation before writing.
5. Copy only missing infrastructure from the skill-relative bootstrap. Preserve existing files and package entries, merge missing scripts and dependencies, then install dependencies.

Ensure this full dependency set:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build/lint/render development dependencies: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `eslint`, `@eslint/js`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `typescript-eslint`, and `playwright`.

Keep the scaffold styling-framework-neutral. Do not add Tailwind, another required styling framework, or default presentation colors, fonts, spacing scales, card/button treatments, borders, shadows, or theme tokens. Use presentation-local plain CSS unless the host already has a styling framework or the user asks for one. Do not overwrite an existing anchor during a partial scaffold.

## 4. Create or modify

For a new presentation, create `src/presentations/<slug>/` with:

- `entities.ts`: stable, presentation-local identity names for elements that persist or morph.
- `steps/`: step modules plus a small `steps/index.ts` exporting the ordered `STEPS`. Each step supplies a unique id, era, title, caption, scene component, and payload. Use a shared scene module when steps evolve one grouped scene, as in the worked example. Compose generic nodes from `src/presentation-kit/` so continuing entities retain stable IDs and positions; describe each visual beat in the scene model.
- `Talk.tsx`: render the ordered steps through `<Presentation>` and import local CSS.
- `presentation.css`: the visual system for this presentation, including locally styled active navigation/TOC/progress and legible attribution when those controls are shown. Start with the user's direction; the CSS template contains no visual preset.

Register the presentation with one explicit entry in `src/presentations/index.ts`, using a dynamic import of `./<slug>/Talk`. Keep other entries and folders intact. The worked example demonstrates the required nine-step content and visual quality; follow its scene and styling conventions.

For a modification, identify the target from the registry. If the request does not name a unique presentation, list registered presentations and ask which one before editing. Ask only about the requested change; do not repeat the create interview. Preserve the target's existing patterns and other routes.

## 5. Self-verify and inspect

Do not report completion until the result builds, renders, and has been visually inspected. Run checks from the presentation app root:

1. `npm run build`.
2. `npm run verify` for the production route/render check. At minimum confirm the first step renders without runtime or console errors; the project's full check should cover every step.
3. `npm run inspect -- <slug>` to capture settled screenshots and review advisory warnings. Keep screenshots under the project's `.and-scene/screenshots/`. If no local helper exists, put any temporary Playwright helper under the project root so it resolves that project's dependencies.
4. Review screenshots of the first and last steps and every dense/key step. Use `--narrow` for responsive-sensitive scenes. Inspect with the available browser tooling when needed. Fix accidental overlaps and collisions with captions, TOC, progress, navigation, or other chrome; make the active control distinct and attribution legible. Mark overlap with `data-presentation-allow-overlap` only when it is intentional and remains readable, then inspect again.

Fix any build, route, runtime, console, or composition failure and rerun the relevant checks. Report completion with this structure:

```text
Route: /<slug>
Checks: build <pass/fail>; verify <pass/fail>; inspect <pass/fail>
Steps reviewed: <list>
Advisory warnings: <list or none>
Remaining issues: <list or none>
```

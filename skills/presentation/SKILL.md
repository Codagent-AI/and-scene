---
name: presentation
description: Create or modify browser-based presentations as one evolving diagrammatic scene. Use when the user asks for a presentation, visual talk, or changes to an existing presentation.
---

# Presentation skill

Create browser presentations as one scene that changes through named steps. Stable entities keep stable IDs and positions as new entities appear, connections are added, and earlier content remains visible. A presentation owns its visual design; the reusable scene kit owns behavior and geometry only.

## 1. Understand the request

Determine whether this is a create request or a modification. For a modification with no clear target, inspect the presentation registry, list the available presentations, and ask which one to change before editing. Once selected, ask only about the requested changes; do not repeat the creation interview.

For a new presentation, gather the following details from what the user already supplied:

1. Topic or central question.
2. Visual style and intended audience, if relevant.
3. Ordered steps. For each, gather a title, what the viewer should understand, a short caption, and a visual description of what appears, changes, or persists.

Ask for missing details **one question at a time**. Do not invent details the user could still supply. The user controls the level of detail. If they want to proceed with incomplete answers, accept that choice, record sensible implementation assumptions, and make the result easy to revise. Do not impose a minimum number of steps. An ASCII sketch can help confirm a particularly complex composition, but is optional and should be limited to the steps where it helps.

## 2. Resolve the app and scaffold only missing contracts

Resolve this skill's own directory from this `SKILL.md` location before looking up any template. Never locate `templates/` relative to the shell's current working directory.

Inspect the intended project and detect these three anchors at the contract level:

- **Build setup:** Vite + React + TypeScript with a working `npm run build`.
- **Scene kit:** `Step`/`Scene` data contract; an active-step stage that supports entity continuity/morphs; present/browse navigation; caption/contents chrome; and fixed-canvas fit scaling.
- **Presentation index:** an explicit or equivalent registry that maps multiple presentations to independent routes.

Accept alternate filenames, formatting, and extra dependencies when the contracts exist. Do not overwrite a complete anchor merely because it differs from this scaffold. If every anchor exists, use the host app. If only some exist, add only the missing contracts and their required dependencies, preserving existing work.

Resolve the scaffold target before writing:

- Empty directory or standalone project: use the project root.
- Monorepo (workspace declaration, `pnpm-workspace.yaml`, or `packages/` / `apps/` layout): create a self-contained app under `presentations/`.
- Already inside a presentation app with anchors: use that app.

For a non-empty project that lacks the scene kit or presentation index, state the exact target path and wait for confirmation before writing. This confirmation applies to scaffold writes; continue read-only inspection while waiting.

Copy templates from paths resolved relative to this skill directory:

- `templates/bootstrap/` for the full starter app and scene kit.
- `templates/presentation/` for a new presentation folder.
- `templates/step/` for a new step module.

For a partial scaffold, copy only missing files/contracts and adapt imports to the host rather than replacing unrelated files. Install dependencies after scaffolding; never assume they are already installed. Ensure runtime dependencies `react`, `react-dom`, `motion`, and `lucide-react`, and build/tool dependencies Vite, `@vitejs/plugin-react`, TypeScript, React/Node type packages, ESLint and its configured plugins, and Playwright. Use the host's package manager and lockfile when present. Do not add Tailwind or another styling system unless it is already used by the host or the user requests it.

## 3. Create or modify

For creation, make a new self-contained directory under `src/presentations/<kebab-case-slug>/` (or the host's equivalent), with an entry component, stable entity ID namespace, step modules, and presentation-owned CSS. Add exactly one registration to the presentation index. Preserve all existing presentations and routes.

Use the kit's `Presentation`, `Step`, `Scene`, `SceneLayer`, and generic primitives. Give each continuing entity a stable identity/layout ID. Model later steps as additions, transformations, connections, emphasis, and exits in one evolving composition; do not redraw the whole diagram or arbitrarily relocate entities between steps. Supply a title and caption for every step and make navigation reachable.

For modification, edit only the selected presentation and the minimal registry or shared-host files needed for the requested change. Keep other presentations unchanged. Do not place visual design in `presentation-kit/`.

Default to plain CSS owned by the presentation. Choose and implement its palette, typography, spacing, shapes, and control treatments locally. The kit and bootstrap kit must remain free of palette, font, spacing scale, borders, shadows, card/button treatments, theme tokens, and styling-framework defaults.

## 4. Verify and inspect before reporting success

Run the host build (`npm run build`) and fix failures. Then use the project's local verification command if available (`npm run verify`); otherwise use Playwright from project-local dependencies to open the presentation route and confirm its first step renders without console or page errors. Do not claim success while a check fails.

Use the project-local screenshot helper when available, normally `npm run inspect -- <slug>`. It should write per-step settled screenshots beneath a predictable project-local artifact directory and provide advisory diagnostics. Review its warnings and screenshots; fix accidental text/chrome collisions, indistinct active navigation, and missing, default-looking, or undersized attribution. Mark an overlap as intentional only when it is readable and compositionally deliberate.

Inspect the first step, last step, and each dense or visually important step. Use a narrow viewport too when the composition or controls may be responsive-sensitive. Confirm the diagram fits its fixed canvas, the caption and controls do not collide with content, continuing entities remain coherent, and navigation/active state are clear. Re-run build, render, and inspection after fixes.

## 5. Report completion

Summarize the presentation created or changed, its route, and the checks actually completed. Mention any remaining advisory visual warnings accurately. Do not report a build, render, or visual check as passing unless you observed it pass.

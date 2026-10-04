---
name: presentation
description: Create or modify a browser presentation as one evolving scene using the local And Scene kit. Use when asked to make, add, or change a presentation.
---

# Create or modify a presentation

Treat a presentation as one scene that evolves through named steps. Stable entities keep stable IDs and positions as they enter, persist, and leave. Each step has a title, caption, and visual intent. The presentation owns its visual style; the reusable kit owns behavior and geometry.

## 1. Identify the task and gather requirements

Decide whether this is a new presentation or a modification. For a new presentation, gather the topic, visual direction, and for each step its narrative purpose/content and visual arrangement. Ask **one concise question at a time**, requesting only information that is missing from the user's prompt. Do not fill in details that the user can still provide. Ask how the user wants to proceed when details are incomplete; if they choose to proceed with partial detail, record what is known and make a coherent first draft without imposing a completeness gate. Invite iteration after the first draft. A compact ASCII sketch may help with a key or complex composition; use it selectively.

For a modification, identify the target presentation first. If the request does not name a unique target, list the registered presentations and ask which one. Then ask only about the requested change; do not repeat the create interview.

## 2. Locate the app and its contract anchors

Resolve this skill's directory from the location of this `SKILL.md`; all template paths below are relative to that directory, never the caller's working directory.

Inspect the current project before writing. Detect three anchors by capability, not exact formatting:

1. **Build setup:** package scripts and Vite/React/TypeScript configuration that provide a working `npm run build`.
2. **Scene kit:** a typed Step/Scene contract, active-step host with entity continuity/motion, mode/navigation/chrome, and fixed-canvas fit scaling.
3. **Presentation index:** an explicit registry mapping presentation slugs to route components, with routing that consumes it.

If all anchors exist, reuse them. If only some exist, add only missing infrastructure and preserve existing files and behavior. When an existing anchor is partial, inspect its contract and fill only the missing capability. Do not overwrite an existing app wholesale.

Resolve target location before scaffolding:

- Empty directory or standalone project: project root.
- Monorepo (package.json workspaces, `pnpm-workspace.yaml`, or `packages/`/`apps/` structure): a self-contained app in `presentations/`.
- Already-scaffolded app: use the app containing the anchors.

For a non-empty, unscaffolded project, state the chosen target and obtain confirmation before writing. This is the scaffold-target confirmation; it does not replace any normal questions about the presentation itself. In monorepos, preserve root files and unrelated packages. Copy the standalone bootstrap only into the resolved app target, not over the monorepo root.

## 3. Scaffold missing infrastructure

Copy templates from `templates/` beside this skill. `templates/bootstrap/` is a complete standalone Vite + React + TypeScript app and scene kit; `templates/presentation/` and `templates/step/` are authoring starters. Adapt paths and package setup only as needed for the host. Ensure all three anchors and their full dependency contract exist even when partially scaffolded.

Required packages:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Development/build: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, ESLint with the React hooks/refresh and TypeScript stack, and `playwright` for browser checks.

Install missing dependencies using the package manager already in use (npm for the bootstrap). Never add Tailwind or another styling framework unless the host already uses it or the user asks for it. Do not install dependencies in a monorepo root when the app belongs under `presentations/`.

The kit template must remain style-neutral: no palette, typography, spacing system, borders, shadows, card or button treatments, theme variables, or required CSS framework. Inline positioning may express runtime geometry and must not become a visual theme. Put the generated visual design in presentation-owned plain CSS by default.

## 4. Create or modify the presentation

For a new presentation, create a self-contained folder under the app's `src/presentations/<slug>/`, with stable entity IDs in `entities.ts`, one or more `steps/*.tsx` scene components, and a `Talk.tsx` entry using the kit's generic `Presentation` boundary. Add exactly one explicit registry entry and ensure the route resolves. Do not modify existing presentation folders. Start from `templates/presentation/` and `templates/step/` as useful.

For a modification, edit only the selected presentation and the smallest necessary registry or host styling files. Preserve other presentation routes and content. Keep related entities' IDs stable across steps so layout projection can animate continuity. Describe which entities persist, enter, move, connect, or exit. Give every step its own title and useful caption; compose within the fixed 880 × 380 canvas.

Use presentation-local CSS (or the host's established styling system) for palette, type, spacing, node treatments, active navigation, and attribution. Keep the kit free of those decisions. Add the explicit overlap-allow marker only to an intentional and readable overlapping subtree.

## 5. Build, render, inspect, and repair

Run `npm run build`. Then render the new/modified route in a real browser with no runtime or console errors. At minimum check its first step. Inspect settled screenshots of the first, last, and densest/key steps; include a narrow viewport when the layout is responsive-sensitive. Prefer `npm run inspect -- <slug>` when available; it captures every settled step and reports advisory overlap, active-state, and attribution issues. Review each warning, fix accidental collisions and polish chrome, then inspect again. If an inspection helper is not available in an existing host, put any temporary browser helper inside the project root and remove it afterward.

When the scaffold's `npm run verify` exists, run it as well. It builds the complete app and drives the committed example through every step; for a generated presentation, also verify its route and representative states. Never report success while a build, render, or visual-composition problem remains. Repeat checks after fixes.

## 6. Report completion

Summarize the presentation created or changed, its route, key design choices, checks run, screenshots inspected, and any remaining advisory warning that could not be resolved. Be clear about what was verified; do not claim browser or visual checks that were not performed.

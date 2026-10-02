---
name: presentation
description: Create or modify browser presentations as continuously evolving diagrammatic scenes using the local React scene kit. Use when asked to make, build, or change a presentation.
---

# Presentation skill

Create a browser presentation from the user's topic as one evolving scene. Stable entities keep their identity and position across named steps; new entities accumulate and later connections build on what is already visible. The host kit owns runtime behavior and geometry. Each presentation owns its visual design.

## 1. Gather requirements

First decide whether the request is to create a presentation or modify one.

For creation, collect the topic, visual direction, and for each step its title, caption or key message, and intended visual content. Ask only one concise question at a time. Inspect the prompt and files already provided first; do not ask for details that are already clear. Ask for the next missing detail instead of inventing it. An ASCII sketch is useful for a key or complex layout; offer or show it only for that step, not every step.

The user controls detail. When required details are missing, ask whether they want to provide them or proceed with partial detail. If they choose to proceed, preserve known constraints and make clearly labeled, minimal creative decisions for gaps; do not impose a completeness gate. A complete prompt can go directly to implementation.

For modification, identify the target presentation first. If unspecified or ambiguous, list registered presentations and ask which one. Once identified, ask only about the requested edits; do not repeat the creation interview.

## 2. Resolve the project and scaffold

Resolve template files from this skill's own directory (`SKILL.md` parent / `templates/`), never from the shell's current working directory. Determine the target project from the user's requested directory or the current project.

Check these three anchors at the contract level:

1. Build: a working Vite + React + TypeScript app and `npm run build`.
2. Scene kit: typed Step/Scene contract, active scene host with entity morphs, browse/present navigation, captions/contents chrome, and fixed-canvas fit scaling.
3. Presentation index: explicit registry mapping independent presentations to routes.

Presence is based on behavior and contract, not filenames or byte equality. Reuse existing anchors and scaffold only missing parts. Do not replace user files or existing presentations. If the project is non-empty and unscaffolded, state the resolved target and what will be added, then wait for confirmation before writing. Empty/standalone projects use the root. In a monorepo (workspaces in package.json, pnpm-workspace.yaml, or packages/ or apps/ layout), make a self-contained app under `presentations/`; preserve root files. If already inside a presentation app, scaffold only missing anchors there.

For full scaffold, copy `templates/bootstrap/` into the resolved target. For partial scaffold, copy only the missing contract pieces and their required supporting files, reconciling names/imports with existing anchors. The template's kit snapshot is a complete working reference. Ensure the full dependency set is installed even if package.json already lists some dependencies:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build/types: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`.
- Lint: `eslint`, `@eslint/js`, `globals`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.
- Browser verification: `playwright` (and Chromium available, e.g. `npx playwright install chromium`).

Merge dependencies/scripts into the target package manifest and install with its package manager. Do not add Tailwind, a CSS framework/plugin, theme tokens, or kit-owned presentation styling unless the host already uses it or the user explicitly requests it.

## 3. Create or modify

Create each presentation as its own directory under `src/presentations/<slug>/`, with `entities.ts`, presentation-owned CSS, step scene components, and `Talk.tsx`; add one explicit lazy registry entry. Use stable entity IDs as layout identities across steps. Prefer a shared Scene component/group for a continuously evolving sequence; retain existing entities in place and add or remove only what the narrative requires. Use the fixed 880 × 380 canvas and generic kit primitives. Give every step a title, era, caption, and payload. Keep the design composed on the canvas with enough room for host chrome.

A new presentation must not rewrite existing presentation files. For a modification, edit only the selected presentation and the minimum necessary registry or shared-host files. Put colors, fonts, spacing, borders, shadows, card/button treatments, and responsive visual choices in presentation-owned plain CSS by default. The reusable kit stays style-neutral.

Templates:
- `templates/presentation/` contains the routed presentation entry and entity namespace starter.
- `templates/step/` contains a typed step and scene starter.
- `templates/bootstrap/` is the complete app + kit starter for missing infrastructure.

## 4. Verify and inspect before reporting success

Run the target app's `npm run build` and `npm run lint`. Ensure the route is registered and render at least the first step without console or runtime errors. Use `npm run verify` when present; otherwise run the project-local browser smoke check if supplied, or create a temporary project-local Playwright script. Use a production preview and `127.0.0.1` for local browser URLs.

Use `npm run inspect -- <slug>` when available. Wait for animations to settle and inspect screenshots of the first and last steps plus dense/key steps. Also inspect a narrow viewport when layout is responsive-sensitive. Review warnings for unintended text/chrome overlap, indistinct active navigation, and missing/default/undersized attribution. Fix functional failures and accidental visual collisions; use an explicit allow-overlap marker only for intentional readable overlap. Rebuild and re-inspect after fixes. Do not report completion until build, render, and visual composition have been checked. Summarize the route, files, commands, and any remaining advisory warnings accurately.

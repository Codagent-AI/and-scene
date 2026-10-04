---
name: presentation
description: Create or modify an evolving-scene browser presentation in the current project. Use when asked to make, explain, or revise a presentation.
---

# Presentation skill

Create a React presentation as one scene that evolves through named steps. Stable entities keep their identity and position while cards, labels, arrows, and emphasis enter or leave. Follow the host project's conventions and keep each presentation self-contained.

## Gather requirements

Inspect the request first. If it already gives the topic, visual direction, and per-step content and visual intent, proceed without asking again. Otherwise ask **one concise question at a time**, starting with the most important missing detail: topic, then visual style, then each step's message and what should be visible. Ask for the next step only after the current answer. Do not invent details the user can still supply. The user may explicitly choose to proceed with partial detail; record unknowns as open creative choices and make reasonable, clearly bounded decisions rather than blocking. For a key or complex composition, an ASCII sketch may help confirm layout; use it selectively.

For a new presentation, settle a title, URL slug, ordered steps, each step's title/caption/visual intent, and which entities persist, enter, move, or leave. For a modification, identify the target before asking about edits. If the target is absent or ambiguous, list registered presentations and ask which one; then ask only about the requested changes.

## Resolve the project and scaffold

Resolve this skill directory from the location of this `SKILL.md`; all template paths below are relative to it, never to the caller's working directory. Detect these three anchors by their contracts, not by exact filenames or formatting:

1. Build setup: a Vite + React + TypeScript app whose `npm run build` works.
2. Scene kit: `Step`/`Scene` state contract, fit-scaled stage, scene host with entity morph support, browse/present navigation, and caption/ToC chrome.
3. Presentation index: explicit mapping from presentation slug to independently loadable route.

If all anchors exist, use the existing project. If only some exist, preserve them and add only missing infrastructure. If a standalone project is empty or unscaffolded, target its root. If a monorepo is indicated by package workspaces, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout, target a self-contained app under `presentations/`. For a non-empty unscaffolded project, state the exact target and wait for confirmation before writing. Do not overwrite unrelated files or existing presentations.

The complete starter is `templates/bootstrap/`; individual new-presentation and step examples are in `templates/presentation/`. Copy files from those paths, adapting imports and names to the host. The bootstrap package declares all dependencies even if some are already installed: React, React DOM, Motion, Lucide React; Vite, its React plugin, TypeScript and type packages, ESLint and its React/TypeScript support, and Playwright. Install them through the package manager used by the target. Do not add Tailwind or another styling framework unless already used by the host or explicitly requested. When only an anchor is missing, use the corresponding bootstrap files and merge carefully.

## Create or modify

Create a folder under `src/presentations/<slug>/` (or the host's equivalent), with presentation-owned `Talk.tsx`, `entities.ts`, `steps/`, and plain CSS as needed. Register a new route in the explicit presentation index. Give entities stable presentation-scoped IDs and reuse them across steps when they represent the same thing. Prefer a shared `Scene` and `groupKey` for a continuous sequence; use separate scenes when the composition changes substantially. Captions must explain the point of every step. Keep the content in the fixed design canvas and compose with generic kit primitives.

Visual design belongs to the presentation or host: use presentation-owned CSS for color, type, spacing, borders, shadows, cards, buttons, and active states. Do not put visual defaults in the reusable kit. Preserve other routes and files. For a modification, edit only the chosen presentation and necessary registry entry.

## Verify before reporting completion

Run the project build and available full render verification (`npm run verify` when provided; otherwise use a real browser route smoke check). Require at least the first step to render without runtime or console errors. Use the project-local screenshot helper (`npm run inspect -- <slug>`) when available; otherwise put any temporary Playwright helper under the project root. Wait for motion to settle. Inspect screenshots of the first and last steps and any dense/key steps; inspect a narrow viewport when the layout is responsive-sensitive. Review overlap, active progress/ToC distinction, and attribution warnings. Fix accidental collisions and unclear chrome; mark an overlap as allowed only when intentional and readable. Re-run checks after fixes. Do not report success while a required build, render, or visual check fails.

Report the route, files created or changed, checks run, visual steps/viewports inspected, and any remaining advisory warnings.

---
name: presentation
description: Create or modify browser presentations as one evolving, navigable scene. Use when asked to make, build, create, or change a presentation in this repository or another project.
---

# Presentation skill

Create browser-based presentations as one diagrammatic scene that changes through named steps. Stable entities should persist and move; new entities enter and obsolete entities leave. Each presentation owns its visual design. The shared scene kit owns behavior and geometry only.

## 1. Understand the request

Classify the request as create or modify. For creation, gather the topic, intended audience/purpose when relevant, visual direction, and the content and visual intent of each step. Ask for missing details **one question at a time**; do not silently invent details the user could still supply. Offer an explicit option to proceed with partial details and iterate later. A complete request can proceed directly. For a complex key step, a small ASCII layout sketch can clarify composition.

For modification, inspect and list registered presentations first. If the target is missing or ambiguous, ask which one before editing. Once selected, ask only what change is wanted and keep edits scoped to that presentation and the necessary registry entry.

## 2. Locate the app and resolve scaffold anchors

Resolve paths to this skill's files from the skill directory, never from the caller's current directory. For example, treat `templates/bootstrap/`, `templates/presentation/`, and `templates/step/` as paths relative to this `SKILL.md`.

Inspect the project and detect these anchors at the contract level (equivalent names/structure are acceptable):

1. **Build setup:** Vite + React + TypeScript and a working `npm run build`.
2. **Scene kit:** typed step/scene contract, active scene stage with entity morph behavior, navigation and present/browse modes, caption/contents chrome, and fit-scaled canvas.
3. **Presentation index:** explicit or equivalent registry mapping presentations to routes.

If all are present, preserve them and continue. If only some are present, add only missing infrastructure without overwriting existing files. If all are missing, use the full bootstrap. For an empty or standalone project, target its root. For a monorepo (workspace declaration, `pnpm-workspace.yaml`, or `apps/`/`packages/` layout), target a self-contained app under `presentations/`. In a non-empty unscaffolded project, state the resolved target and wait for confirmation before writing. Preserve unrelated files and existing build setup.

The bootstrap is a complete snapshot at `templates/bootstrap/`; copy it from the skill-relative path. Its `src/presentation-kit/` is kept byte-aligned with this repository's canonical kit. For partial scaffolds, use the relevant bootstrap files as references and merge only missing anchors.

Install the dependencies the app needs even if you believe some are already installed: React, React DOM, Vite, React plugin, TypeScript and React/Node types, Motion, Lucide React, ESLint and its configured plugins, and Playwright. Install using the host package manager/lockfile where appropriate. Do not add Tailwind or another styling framework unless already used by the host or explicitly requested.

## 3. Create or update

Use `templates/presentation/` for a new presentation and `templates/step/` as a starting point for each step. Create a self-contained directory under the app's presentations directory, assign a URL-safe unique slug, provide stable entity IDs, and register it without changing other entries. Every step needs an era, title, caption, scene component, and typed payload. Organize steps as one evolving composition: retain continuing entities with stable IDs/layout IDs, add entrants, and remove departing entities deliberately.

Put a designed look in presentation-owned CSS (plain CSS by default) or host-owned styling. Never add visual defaults to the reusable kit: no palette, typography, spacing system, borders, shadows, card/button treatment, or theme tokens. Make active progress/contents states and attribution visibly legible in the presentation or host CSS. Mark an overlap with the kit's explicit allow-overlap hook only when it is intentional and remains readable.

## 4. Verify and inspect

Before reporting completion:

1. Run `npm run build` and fix all errors.
2. Render the new/modified route in a browser and check the first step for console and runtime errors. If `npm run verify` exists, run it as well.
3. Inspect settled screenshots of the first and last steps and every dense/key step. Check a narrow viewport when the composition is responsive-sensitive. Prefer the project's `npm run inspect -- <slug>` helper; it writes screenshots under the project and reports advisory overlap, active-navigation, and attribution issues. Otherwise create any temporary Playwright helper within the project root and remove it afterwards.
4. Review every warning at its referenced step. Fix accidental collisions, indistinct active state, and poor attribution; retain an allow-overlap marker only for an intentional readable overlap. Re-run the relevant checks after fixes.

Report the route, changed presentation, build/render/visual checks performed, and any remaining advisory warnings accurately. Do not report success while a required check fails.

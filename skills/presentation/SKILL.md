---
name: presentation
description: Creates and modifies evolving React browser presentations. Activates for requests to create a browser presentation, build an interactive scene, or edit an existing presentation.
---

# Presentation

Create a routed browser presentation from a topic, or make a scoped change to an existing presentation. Presentations use ordered named states that evolve one diagram: entities keep stable IDs and positions while new entities enter and removed entities exit.

## Out of Scope

This skill creates browser-based scene presentations. It does not create PowerPoint files, PDF decks, or video exports; use a document or media workflow for those deliverables.

## Gather the request

First decide whether this is a new presentation or a modification.

For a new presentation, gather the topic, visual direction, and each step's title, caption, scene content, and visual intent. Ask for missing details one question at a time, combining related details in one concise question only when useful. Do not invent details the user can supply. The user can explicitly choose to start with partial information; proceed with what they gave and leave open decisions for iteration. An ASCII sketch can help settle a complex composition, but is optional.

For a modification, identify the target presentation first. If it is ambiguous, list the registered presentations and ask which one. Once selected, ask only about the requested change; do not repeat the creation interview.

## Resolve the app and scaffold

Work from the application directory. Resolve this skill's resources relative to this `SKILL.md` (never relative to the shell's current directory): `templates/bootstrap/`, `templates/presentation/`, and `templates/step/`.

Check three contract anchors:

1. **Build setup:** React + TypeScript + Vite and a working `npm run build`.
2. **Scene kit:** a typed step/scene contract, an active scene stage that handles entity transitions, present/browse navigation and chrome, and a uniformly scaled fixed canvas.
3. **Presentation index:** an explicit registry that maps slugs to independently routed presentations.

Check behavior and exported contracts, not exact filenames or byte identity. Cosmetic differences and extra dependencies are fine. If all anchors exist, use the host app as-is. If only some exist, preserve working anchors and unrelated files, and add only missing infrastructure and its dependencies. If none exist, use the complete bootstrap template.

Choose the target before writing. In an empty or standalone project, use its root. Detect a monorepo from workspace declarations (`workspaces` in `package.json` or `pnpm-workspace.yaml`) or a conventional `apps/` or `packages/` layout; in that case use a self-contained app under `presentations/`. In a non-empty project missing any anchor, state the resolved target and wait for confirmation before scaffold writes. Do not overwrite existing app files or presentations; reconcile missing pieces with the host project.

The full bootstrap provides the React/Vite/TypeScript app, scene kit, router, registry, local verification and screenshot helpers. It declares all required dependencies even if some happen to be installed: `react`, `react-dom`, `motion`, `lucide-react`, `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack, and `playwright`. Install dependencies in the selected app. Do not introduce Tailwind or another styling framework unless the host already uses it or the user asks for it. For a partial scaffold, add the dependencies required by each missing anchor and its verification path.

The kit owns behavior, geometry, identity hooks, and semantic state only. It must not own colors, fonts, spacing scales, borders, shadows, card/button treatments, or theme tokens. Put the visual design in presentation-owned CSS by default, or in the host's existing styling system.

## Create or edit

Create each new presentation in its own directory with an entity ID namespace, step modules, a presentation entry component, and presentation-owned styles. Use the presentation and step templates as starting points, adapting them to the actual kit exports. Register a new slug in the explicit presentation index. Keep every existing presentation and route intact.

Represent continuing things with stable entity IDs and compose the scene from the generic kit primitives. Keep content on the fixed design canvas; do not make each step an unrelated slide. Give every step an era, title, and useful caption. For edits, touch only the selected presentation and the registry or shared app files required by the requested change.

## Verify and inspect

From the app root:

1. Run `npm run build`; resolve type and build errors.
2. Run the project's render verification (`npm run verify` when available). Confirm that the created or modified route is included and that its first step renders without console or runtime errors. Visit each step when the verification command supports it.
3. Use the project-local screenshot helper (`npm run inspect -- <slug>` when available). Otherwise write any temporary browser helper under the project root. Wait for transitions to settle, then inspect the first, last, and densest or most important steps. Check a narrow viewport when the design may be responsive-sensitive.
4. Review visual warnings and screenshots. Fix accidental collisions, unreadable content, indistinct active navigation, and poor attribution. Mark overlap as intentional only when it is readable and compositionally deliberate. Re-run affected checks after fixes.

Do not report completion while build or render checks fail. In the completion summary, name the route, the files or presentation changed, the checks actually run, and any remaining visual warning or limitation accurately.

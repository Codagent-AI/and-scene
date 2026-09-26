---
name: presentation
description: Create or modify browser presentations as one evolving diagrammatic scene. Use when a user asks to make, build, create, or change a presentation, talk, or narrated visual explanation.
---

# Presentation skill

Create one browser presentation as a scene that evolves through named steps. Keep entities stable across steps so they can move, change, enter, or leave in place. Work in the user's project and use its local scene kit and verification tools.

## 1. Gather the brief

Read the request and any existing project context first. Determine whether the user wants a new presentation or a change to one.

For a new presentation, gather the topic, visual style, and each step's narrative and visual intent. Ask only for missing details, one concise question at a time. A step should have an era/section, a short presenter title, a browse caption, and what is visible or changes in the scene. Let the user decide how much detail to provide. If they choose to proceed with partial details, build from what is known and make restrained, reversible choices for gaps. Do not turn optional detail into a completeness gate. An ASCII sketch can help confirm a key or complex layout; use it selectively.

For a modification, identify the target presentation first. If the request does not identify one and several exist, list their titles/routes and ask which one. Ask only about the requested change. Do not repeat the create interview.

## 2. Resolve the app and scaffold missing contracts

Resolve this skill's own directory from this `SKILL.md` location. Its template paths are relative to that directory, never to the caller's working directory. For a complete fresh app, invoke the colocated helper as `node <skill-directory>/materialize-bootstrap.mjs <empty-target>`; the helper resolves `templates/bootstrap/` relative to itself and refuses to overwrite a non-empty target. Resolve `templates/presentation/` and `templates/step/` from the same skill directory.

Resolve the app target before checking contracts. In a monorepo, the target is a self-contained app under `presentations/`; root-level package/build files belong to the host monorepo and do not satisfy anchors inside that app. If an app already exists under `presentations/`, use that app. Otherwise bootstrap a complete app there and leave the monorepo root untouched. For a standalone project, the target is its root. Then check these three contracts in the selected app, not by exact filenames or formatting:

1. **Build setup:** Vite + React + TypeScript and a working `npm run build`.
2. **Scene kit:** typed step/scene contract, fixed-canvas stage and fit scaling, grouped scene continuity/motion, present/browse chrome and navigation.
3. **Presentation index:** explicit route registry that lets several presentations coexist.

If all exist, use the selected app. If some exist, preserve them and fill only missing contracts. Before writing into a non-empty unscaffolded target, state the selected target and ask the user to confirm it. Empty targets need no confirmation. In a monorepo do not overwrite root build configuration or unrelated files.

Materialize the full snapshot in `templates/bootstrap/` for a fresh app, or copy only missing contract pieces for a partial scaffold. Install required dependencies even if a manifest appears to list them: React, React DOM, Motion, Lucide, Vite, React plugin, TypeScript and React/Node types, ESLint stack, and Playwright. Use the committed template lockfile when bootstrapping the complete snapshot. Do not add Tailwind or another styling system unless the host already uses it or the user requests it. Resolve every copied template from the skill directory.

## 3. Create or modify

For a new presentation, create a kebab-case directory under the app's `src/presentations/`, with an entry component, stable entity IDs, step data/components, and presentation-owned CSS. Add exactly one explicit registry entry with a route slug. Never replace or rewrite existing presentations. Use `templates/presentation/` and `templates/step/` as examples; adapt them to the actual topic and kit API.

For a modification, edit only the selected presentation and the smallest required registry or host files. Preserve unrelated presentations and existing scene identity. Make styling choices in presentation-owned or host-owned CSS, not in `src/presentation-kit/`. Every step needs an ID, era, title, caption, and scene state. Reuse entity IDs when an entity continues; add or remove entities to express the change instead of redrawing the whole scene.

## 4. Verify and inspect

Run the app's build. Then run its `npm run verify` when available; otherwise open the generated route in a local browser and confirm the first step renders without runtime or console errors. Fix failures and rerun checks before reporting completion.

Run the project-local `npm run inspect -- <slug>` helper when available. If no helper exists, create any temporary Playwright inspection script inside the project. Inspect settled screenshots of the first and last steps and every dense/key step; use a narrow viewport when the composition is responsive-sensitive. Review overlap, active navigation, and attribution warnings. Fix accidental collisions, make active controls visibly distinct and attribution legible, and use an explicit allow-overlap marker only for intentional readable overlaps. Do not report visual verification from a build alone.

## 5. Report

Summarize the created or modified route, key scene choices, and the build/render/visual checks actually completed. Be clear about any check that could not run; never describe an unchecked result as passing.

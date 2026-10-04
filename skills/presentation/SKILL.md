---
name: presentation
description: Creates or modifies browser presentations as one evolving diagram using the local scene kit. Use when the user asks to "make a presentation", "build a talk", "create slides", "add a step or beat", or "edit my presentation", or mentions scene kit, beats, or a presentation slug.
---

# Create or modify browser presentations

Build one scene that changes through named beats. Reuse the scene kit for behavior; put visual choices in presentation-owned CSS.

## Template map

- `templates/bootstrap/`: self-contained app, canonical kit snapshot, registry, and local verification/inspection scripts.
- `templates/presentation/`: presentation entry, styles, entity namespace, and starter step list.
- `templates/step/`: a step scene component starter.

Replace every `{{...}}` placeholder: `{{APP_NAME}}` is the lowercase package name; `{{SLUG}}` is the route/entity namespace; `{{SLUG_CLASS}}` is a CSS-safe class based on the slug; `{{PRESENTATION_TITLE}}` is the presentation title; `{{SECTION}}` is the step's era; `{{STEP_TITLE}}` and `{{STEP_CAPTION}}` are that beat's narration. Replace example IDs and visuals with the gathered content.

Read `references/scaffolding.md` for exact anchor contracts and the complete dependency list.

## Out of scope

This skill creates and modifies browser presentations. It does not export PPTX, PDF, or Google Slides; host or deploy a presentation; or change the reusable scene kit's behavior or visual defaults. Keep requested styling frameworks in the host or presentation, never in the kit. Route kit changes to a separate scene-kit task.

## 1. Identify the request and gather details

Decide whether the request is to create a presentation or modify one. Use details already supplied. For a new presentation, gather the topic, visual direction, and each beat's narration/content and intended visual change, asking one concise question at a time. Stop when the beats are described or the user chooses to proceed with partial details. Do not invent missing details. A complete prompt needs no follow-up.

Summarize captured beats in this compact form when useful:

```text
1. [section] Beat title — what the viewer sees; what changes from the prior beat
```

For a key or complex layout, an ASCII sketch can confirm arrangement; use it selectively.

For modifications, first identify the target. If the name or slug is missing or ambiguous, list registered presentations and ask which one. Then ask only about the requested edits. Do not repeat the creation interview or alter unrelated presentations.

## 2. Resolve the app and scaffold

1. **Resolve the target.** Work in the user's current project. An empty directory or standalone app uses its root. A monorepo (workspace declaration, `pnpm-workspace.yaml`, or a `packages/` / `apps/` layout) gets a self-contained app in `presentations/`. If already inside an app, use it. In a non-empty unscaffolded target, state the proposed location and wait for confirmation before writing. Resolve this skill's directory from this `SKILL.md`; template paths are relative to it, never to the shell's current directory.

2. **Inspect anchors.** Check the target app for these three contracts; equivalent filenames, formatting, and extra dependencies are fine. A monorepo root's build setup does not count as the self-contained app's build anchor.

3. **Scaffold missing contracts.** Reuse all present anchors. For a full scaffold, copy `templates/bootstrap/` into the resolved app root. For a partial scaffold, copy only missing infrastructure and compatible support files, merging deliberately without overwriting host files. The scene kit includes a generic `Step`/`Scene` contract, fixed-canvas active-step host with entity morph support, present/browse navigation and caption/contents chrome, and fit scaling. The index maps multiple slugs to independently loadable routes.

4. **Install and check dependencies.** Do not assume required packages are globally available. The bootstrap's dependency list is in `references/scaffolding.md`; add the full set when scaffolding. Do not add Tailwind or another styling framework unless the host already uses it or the user requests it.

The kit may define canvas and chrome geometry and behavior, but no palette, typeface, spacing system, border, shadow, card/button treatment, theme token, or CSS framework. Use presentation-owned plain CSS by default.

## 3. Create or modify

For a new presentation:

1. Read the registry and one existing presentation's steps, entities, and CSS; match their names and structure. In this repository, see `src/presentations/how-to-make-a-presentation/` when it exists.
2. Choose a URL-safe unique slug and create `src/presentations/<slug>/` (or equivalent) as a self-contained presentation. Keep entities and stable `layoutId` values namespaced to it.
3. Create step data/components with stable IDs, era/section, one-line title, browse caption, and scene state. Derive numbering from array order. Use a shared `groupKey` and scene component for successive states; preserve continuing identity/position, delay newcomers until continuing motion settles, and exit departing entities. Do not redraw the scene as unrelated slides.
4. Design in presentation-owned files. Keep captions useful, controls navigable, text readable, and content clear of chrome. Distinguish active progress/contents and style attribution through its hook.
5. Add one explicit registry entry and ensure the route is reachable. Preserve existing entries and routes.

For a modification, edit only the selected presentation and the minimum registry/host files required by the request. Preserve other presentation directories, registry entries, and behavior. Ask only for the requested visual/content decisions.

## 4. Build, render, and inspect

Run the app's build and fix all type/build failures. Then render the route in a real browser and check for runtime and console errors. Use the project's `npm run verify` if it checks that route; otherwise use its local render check or launch its preview and inspect the route. At minimum inspect the first step. Before completion, visually inspect settled views of the first, last, and densest/key step; check a narrow viewport when layout is responsive-sensitive. Use the project-local screenshot helper when available (`npm run inspect -- <slug>` in the bootstrap); it keeps Playwright local, waits for motion, and reports advisory collisions and chrome polish issues. Otherwise put any temporary Playwright helper under the app root.

Review every warning. Fix accidental text/chrome collisions and indistinct active state, and style attribution. Mark an overlap with `data-presentation-allow-overlap` only when intentional and readable. Re-run checks after fixes. The densest step is the beat with the most visible entities or the most crowded chrome/content arrangement.

Do not report success if build/render fails or key content is visibly broken. Keep `templates/bootstrap/src/presentation-kit/` aligned with the canonical kit; never place topic-specific visuals there.

Use this completion format:

```text
Route: /<slug>
Files changed: <paths>
Build: pass/fail
Render: pass/fail; <steps checked>
Visual inspection: <step numbers and viewport sizes>
Warnings: <resolved items or remaining advisory warnings>
```

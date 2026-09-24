---
name: presentation
description: Create or modify browser based presentations as one evolving scene. Use when asked to make, build, create, or change a presentation.
---

# Presentation skill

Create an interactive browser presentation as one diagrammatic scene that changes through named steps. Keep content and visual styling in the presentation; the reusable scene kit supplies behavior and geometry only.

## 1. Identify the request and gather details

Decide whether the user wants a new presentation or a change to an existing one.

For a new presentation, gather these details one question at a time. Do not invent information that the user can still supply:

1. Ask for the topic if it is not clear.
2. Ask for the visual style if it is not clear (examples may help, but do not prescribe a style).
3. Establish the ordered steps. For each step, ask what changes or is explained and how the diagram should look if those details are missing. Continue until the user considers the outline sufficient.

The user controls the amount of detail. If details remain open, explicitly offer to proceed with the information captured or continue refining. Proceed when the user opts in to partial detail; do not enforce a completeness gate. A complete prompt may go straight to implementation. For a key or complex composition, an ASCII sketch may help confirm the layout; use it selectively, not for every step.

For a modification, first identify the target. If the target is unclear, inspect and list registered presentations and ask which one to modify before editing. Then ask only about the requested change. Do not repeat the full creation interview.

## 2. Resolve the app target and scaffold missing contracts

Resolve paths from the directory containing this `SKILL.md`; never assume the current working directory is the skill directory. Use `node <skill-directory>/scripts/copy-template.mjs <bootstrap|presentation|step> <target-directory>` to copy a template; the helper resolves source paths from its own location and preserves existing paths. The scaffold snapshot is `templates/bootstrap/`, and reusable presentation starter files are in `templates/presentation/` and `templates/step/`.

Inspect the candidate app for these three contract anchors (cosmetic differences do not count as missing):

- **Build setup:** a Vite + React + TypeScript app whose `npm run build` works.
- **Scene kit:** a typed `Step`/`Scene` contract, active-step scene host with entity morph support, present/browse navigation and chrome, and fit-scaled canvas.
- **Presentation index:** an explicit registry associating each presentation slug/title with a route component loader.

If all exist, reuse the app. If only some exist, preserve them and scaffold only the missing contracts and their dependencies. Do not overwrite existing presentations or unrelated project files.

Resolve the target before writing:

- If already inside an app with these contracts, use that app.
- If the repository is a monorepo (a `workspaces` field in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout), use a self-contained app at `<repository>/presentations/`.
- Otherwise use the repository root. An empty directory is a standalone root target.

When a non-empty project lacks required contracts, state the exact target and what is missing, then wait for confirmation before writing. An empty target requires no confirmation. In a monorepo, do not mutate root build setup when creating the app under `presentations/`.

Materialize only missing files from the bootstrap snapshot. During partial scaffolding, copy only files needed by missing contracts; merge dependency declarations into the host manifest and regenerate its lockfile with the host package manager. Never replace an existing manifest or lockfile with snapshot versions. Ensure dependencies even if `package.json` exists: runtime `react`, `react-dom`, `motion`, `lucide-react`; development/build `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, ESLint and its React/TypeScript plugins/config, and `playwright`. Install what is missing and install Playwright Chromium if no compatible browser is available. Do not add Tailwind, another styling framework, or kit-owned theme defaults unless the host already uses one or the user explicitly requests it.

The kit owns stable hooks, navigation, animation behavior, and stage geometry. It must not own palette, typography, spacing scales, borders, shadows, card/button treatments, or theme tokens. Use presentation-owned plain CSS by default.

## 3. Create or modify the presentation

For a new presentation:

1. Choose a URL-safe unique slug and create a self-contained directory under `src/presentations/<slug>/` (or the app's equivalent layout).
2. Define stable entity IDs in `entities.ts`; keep each step's content and visuals in step modules. Use the presentation template and step template as starting points, adapting them to the supplied topic and style.
3. Model the work as one evolving scene. Reuse IDs for entities that persist, add/remove entities as the narrative advances, and group steps when one scene instance should update its payload. Avoid unrelated slide-like compositions.
4. Provide a title and a concise, meaningful caption for every step. Support next/previous controls and the kit's keyboard, table-of-contents, and progress navigation.
5. Put the visual design in CSS owned by the presentation or host. Keep content inside the fixed canvas, leave room for chrome, make active navigation clearly distinct, and ensure attribution is legible.
6. Add one explicit entry to the presentation registry. Preserve all existing entries and directories.

For a modification, edit only the selected presentation and the registry or shared host files that are necessary for the requested change. Preserve unrelated presentation files and routes.

## 4. Build, render, and inspect before reporting completion

Do not report success until all checks pass; diagnose and fix failures, then rerun affected checks.

1. Run `npm run build` from the app root and resolve all type/build failures.
2. Run `npm run verify` when available. It should open the route in a real browser and confirm the first step renders without console or runtime errors. If no verify script exists yet, run a project-local Playwright smoke check against the app's preview and check the route and browser console.
3. Run `npm run inspect -- <slug>` when the project-local screenshot helper exists. Otherwise create any temporary Playwright inspection script under the app root and remove it after use. Do not put temporary helpers in `/tmp`.
4. Inspect settled screenshots or equivalent browser views of the first, last, and densest/key steps. At narrow width, inspect representative steps if the layout is responsive-sensitive. Review overlap, active-state, and attribution warnings. Fix accidental collisions and polish chrome; allow an overlap only when it is intentional and remains readable.
5. When iterating a long sequence, use browser snapshots before screenshots. Report the build/render/visual checks actually completed and any advisory findings remaining.

## Completion report

Summarize the created or modified presentation, its route, and the build, render, and visual checks. Never claim a check passed unless it ran successfully.

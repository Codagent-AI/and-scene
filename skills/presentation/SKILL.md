---
name: presentation
description: Creates or modifies browser-based presentations as evolving scenes. Activates for requests such as “create a browser presentation,” “animate a diagram through steps,” or “update an existing scene presentation.”
---

# Presentation skill

Create a browser presentation as **one scene that evolves through named steps**.
Stable entities keep their IDs and positions as they persist; new entities enter,
changed entities morph, and removed entities leave. Do not implement unrelated
slides that redraw the whole composition.

## 1. Identify the request

Decide whether the user wants a new presentation or a change to an existing one.
This skill supports browser-based presentations in the local React scene kit. It
does not author native PowerPoint or Google Slides files; direct those requests
to the relevant native presentation workflow.
For a modification, inspect the registry and list the available titles/routes if
the target is missing or ambiguous. Ask which presentation to change before
editing. Once selected, ask only about the requested change; do not repeat the
full creation interview.

## 2. Gather requirements one question at a time

For a new presentation, gather these details conversationally, asking one
question and waiting for its answer before asking the next:

1. Topic and intended audience or takeaway.
2. Visual direction (palette, typography, mood, references, or “choose for me”).
3. Ordered steps. For each step, gather its title, caption, what appears or
   changes in the scene, and the intended visual arrangement.
4. Any entities that should persist, enter, move/morph, or leave between steps.

Read the prompt and prior answers first. Do not ask for details already supplied
and do not invent omitted details while the user is available to provide them.
If the user explicitly opts to proceed with partial detail, use the information
captured and make restrained, reversible choices for the gaps; mention those
choices in the completion summary. A complete prompt may proceed without more
questions. For a key or complex composition, an ASCII sketch can help confirm
layout, but it is optional and should not be repeated for every step.

## 3. Resolve the app target and inspect its anchors

Resolve the target before writing files. An existing presentation app is the
directory containing all three contract anchors:

- **Build setup:** package scripts/configuration for a working Vite + React +
  TypeScript `npm run build`.
- **Scene kit:** a typed step/scene contract, scene host with entity transitions,
  present/browse navigation and chrome, and fixed-canvas fit scaling.
- **Presentation index:** a registry that maps distinct presentation slugs to
  independently routed entries.

Detect anchors by their behavior and exports, not exact names, formatting, or
byte comparison. Inspect the existing files to confirm each contract. If all are
present, reuse them. If only some are present, add only missing pieces and
preserve existing application choices and presentations.

Resolve the scaffold location as follows:

- An empty directory or standalone project uses its root.
- A monorepo (package.json workspaces, `pnpm-workspace.yaml`, or a `packages/` or
  `apps/` layout) gets a self-contained app under `presentations/`.
- If already inside an app with the anchors, work in that app.

Before writing into any non-empty project that lacks the required app anchors,
state the exact target directory and wait for the user's confirmation. This
confirmation is required even if the likely target is the monorepo's
`presentations/` directory. Do not overwrite unrelated files. If scaffolding is
needed, find templates relative to this skill file (`templates/...`), never
relative to the shell's current working directory.

## 4. Bootstrap missing infrastructure

Use `templates/bootstrap/` as the complete reference scaffold. Materialize it at
the resolved target, then merge only missing anchors where a partial scaffold
exists. The bootstrap includes a sample route that can be replaced or retained.
Do not replace the host's package configuration wholesale when adding a missing
anchor: merge required scripts and dependencies while preserving unrelated
settings.

Ensure these dependencies are declared and installed when their corresponding
infrastructure is scaffolded:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build/type: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`.
- Lint: `eslint`, `@eslint/js`, `globals`, `typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.
- Browser verification: `playwright` and an available Chromium browser.

Do not add Tailwind or another styling framework unless the host already uses it
or the user requests it. The reusable kit owns scene behavior, geometry, and
stable hooks only; it must not impose colors, fonts, spacing systems, borders,
shadows, card/button treatments, or theme tokens. Put the visual design in
presentation-owned CSS, using plain CSS by default.

## 5. Create or modify the presentation

For a new presentation, create a self-contained directory under
`src/presentations/<kebab-case-slug>/` with a `Talk.tsx`, an entity-ID namespace,
step modules, and presentation-owned CSS as needed. Use
`templates/presentation/` and `templates/step/` as starting points. Use stable,
namespaced entity IDs for anything that continues across steps. Each step must
provide a title and a meaningful caption. Compose generic kit nodes and scenes;
do not place topic-specific styling in `src/presentation-kit/`.

Register the presentation once in the explicit `src/presentations/index.ts`
registry with a unique slug, title, and lazy loader. Preserve all existing
entries, routes, and files. For a modification, limit edits to the selected
presentation and the minimum necessary shared/registry changes requested by the
user.

Prefer the contract's stable `data-presentation-*` hooks and accessible
navigation semantics when customizing chrome. Make current progress and table
of contents states visually distinct. Keep attribution readable and styled by
the presentation or host.

## 6. Build, render, and inspect before reporting completion

Run the app's `npm run build`. Then verify the intended route explicitly with
`npm run verify -- <slug>` when that command is available; at minimum, use its
local Playwright tooling or a temporary helper inside the project root to open
the new/modified route and assert its first step renders without console or
runtime errors. Do not verify only an unrelated starter route. Do not report
success while a check fails: diagnose, fix, and rerun the affected checks.

Use `npm run inspect -- <slug>` whenever the project-local screenshot helper is
available. It should use production preview and local dependencies, wait for
transitions to settle, and save per-step screenshots under its documented local
artifact directory. Inspect the first, last, and densest/key steps; inspect a
narrow viewport when the layout is responsive-sensitive. Review advisory
warnings for text/chrome overlap, active-state visibility, and attribution. Fix
accidental collisions and weak chrome; allow-mark only intentional, readable
overlap. Never use screenshots or generated build/dependency output as source
files.

## 7. Report completion

Use this compact report and give each check one of the statuses **passed**,
**failed**, or **not run**. Report failures plainly; do not claim checks that
were not run.

```text
Route: /<slug>
Files: <key presentation and registry files>
Design decisions: <visual direction and any choices made after partial-detail opt-in>
Checks: build — <status>; route render — <status>; visual inspection — <status>
Remaining issues: <advisories or none>
```

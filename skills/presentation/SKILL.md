---
name: presentation
description: Creates or modifies browser-based presentations as one evolving, diagrammatic scene. Activates for requests to make, build, or change a presentation from a topic.
---

# Presentation skill

Create browser presentations as one scene evolving through named steps. Keep stable entity IDs across steps so continuing entities can move, change, appear, and leave. Use the reusable scene kit for behavior; the presentation owns its visual design.

## Out of scope

This skill creates browser-based presentations. It does not create or edit native PowerPoint or Keynote files, PDFs, or image exports. Redirect those requests to an appropriate slide-authoring or document workflow.

## 1. Understand the request

For a new presentation, gather the topic, visual direction, and each step's message plus what the viewer should see. Ask for missing information **one question at a time**; do not invent details the user can still supply. A complete request can proceed directly. The user controls depth: if they choose to proceed with partial detail, use only what they supplied, make restrained choices for unavoidable implementation gaps, and leave room to iterate. For a key or complex layout, an ASCII sketch can help confirm composition; use it selectively, not for every step.

For a modification, first identify the target presentation. If the request does not identify a unique target, list registered presentations and ask which one. Then ask only about the requested changes; do not repeat the creation interview.

## 2. Resolve the app and scaffold only missing contracts

Inspect the current project before writing. Resolve this skill's directory from this `SKILL.md` location (for example, `new URL('./templates/', import.meta.url)` in a script, or the skill file's parent directory), never from the agent's current working directory. Template paths are `templates/bootstrap/`, `templates/presentation/`, and `templates/step/`.

Detect these three anchors by their behavior, not exact filenames or formatting:

1. **Build setup:** a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit:** a presentation-agnostic `Step`/`Scene` contract, active-scene stage with entity morph support, present/browse navigation and chrome, and a fit-scaled canvas.
3. **Presentation index:** a registry that maps distinct presentations to routes.

If all are present, reuse the app. Otherwise scaffold only missing contracts and their dependencies. In a partial scaffold, inspect existing files and preserve them; do not overwrite an existing build setup, kit, registry, or unrelated project content. Use the complete bootstrap snapshot as reference and copy only the pieces required. Resolve the target first:

- Empty directory or standalone project: project root.
- Monorepo (workspace declaration, `pnpm-workspace.yaml`, or `packages/` / `apps/` layout): self-contained app at `presentations/`.
- Already inside a presentation app: that app.

For a non-empty, unscaffolded project, state the target path and obtain confirmation before writing there. Empty targets need no confirmation. In a monorepo preserve root files and put the app's package/build setup inside `presentations/`.

Ensure runtime dependencies `react`, `react-dom`, `motion`, and `lucide-react`, plus Vite, its React plugin, TypeScript, React/Node types, the ESLint stack, and Playwright. Do not assume they are installed. Do not add Tailwind or another styling framework unless it is already used by the host or explicitly requested. The kit owns behavior, geometry, and stable hooks only: no palette, typography, spacing scale, borders, shadows, cards, buttons, or theme tokens. Plain CSS in the presentation is the default visual styling.

## 3. Create or modify

Create each new presentation in its own directory with presentation-local entity IDs, step scene components, and styling. Give every step a meaningful title and caption. Compose generic kit primitives, keep a consistent fixed-canvas composition, and reuse entity IDs for continuing concepts. Add one explicit registry entry and route; preserve every existing presentation and route.

For a modification, edit only the selected presentation and the necessary registry or verification references. Keep unrelated presentation files and entries intact. Use stable `data-presentation-*` hooks supplied by the kit for active state and inspection.

### Materialize the templates

Use a URL or filesystem path resolved from this skill directory to read the templates; never build template paths from the caller's working directory. Choose a route slug containing only lowercase ASCII letters and digits separated by single hyphens (`^[a-z0-9]+(?:-[a-z0-9]+)*$`). Copy the presentation templates to `src/presentations/<slug>/`: `Talk.tsx`, `entities.ts`, `steps.tsx`, and `style.css`. In `steps.tsx`, replace `{{slug}}`, `{{step-id}}`, `{{section}}`, `{{step title}}`, and `{{step caption}}`; use unique stable step IDs, and safely escape inserted text for its TypeScript/JSX context. Replace `{{title}}` in `Talk.tsx` with the safely escaped presentation title. Keep the `entities.ts` namespace derived from the slug.

For individually maintained step components, copy `templates/step/Step.tsx` to `src/presentations/<slug>/steps/<step-name>.tsx`. Its `../../../presentation-kit` imports are correct at this depth. Replace the same step placeholders, rename `ExampleStep` to a valid component name, then import the component into the presentation's step list in order. Do not place this template directly in the presentation root because its relative imports assume the `steps/` directory.

Register the route once in `src/presentations/index.ts`, preserving existing entries. For example: `{ slug: '<slug>', title: '<escaped title>', load: () => import('./<slug>/Talk') }`. Escape quotes in the title as a TypeScript string literal.

## 4. Verify, inspect, repair

Do not report success until all checks pass:

1. Run `npm run build` from the app root.
2. Run the app's `npm run verify` if available; otherwise start its local Vite preview/dev server and use project-local Playwright to open the generated route and confirm the first step renders without console errors or uncaught exceptions. Exercise next/previous when possible.
3. Capture and inspect settled screenshots of the first, last, and densest/key steps. If layout is responsive-sensitive, inspect a narrow viewport too. Prefer `npm run inspect -- <slug>` when available; otherwise put any temporary Playwright helper and screenshots under the project root, and remove temporary artifacts when done.
4. Review visual warnings and screenshots. Fix accidental collisions, clipped content, indistinct active navigation, and illegible attribution. An intentional overlap is acceptable only if readable and explicitly marked with the kit's allow-overlap hook. Keep visual CSS outside the reusable kit.
5. Rerun the checks after repairs. A failure or unresolved visual defect is not a successful completion.

Report the generated route, files changed, build/render results, inspected steps/viewports, and any remaining advisory warnings accurately.

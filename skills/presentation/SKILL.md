---
name: presentation
description: Creates and modifies browser presentations with evolving diagrammatic scenes. Activates for requests to create a presentation, edit presentation steps, or animate a diagram.
---

# Create or modify a presentation

Treat a presentation as one scene that evolves through named states. Stable
entities keep their IDs across steps; each step has a title and an explanatory
caption. Use the shared React scene kit for behavior and geometry. A presentation
owns its visual design in its own plain CSS.

## Out of scope

This skill creates browser-based scene presentations; it does not produce
PowerPoint or Keynote decks, PDFs, or videos. For those deliverables, use the
appropriate document, slide-deck, or video workflow.

## 1. Gather the brief

Determine whether the request is to create or modify. For a new presentation,
gather the topic, visual style, and each step's content and visual intent. Ask
only for details the user has not already supplied, one question at a time. Do
not fill in missing details that the user can still decide. If the user chooses
to proceed with partial detail, work from the information captured and leave
room to iterate; do not impose a completeness gate. If the request already
contains a useful complete brief, proceed without asking redundant questions.
For a complex or key step, an ASCII layout sketch can help settle the composition;
use one selectively rather than for every step.

For a modification, first identify the target presentation. If the target is
missing or ambiguous, list the registered presentations and ask which one. Once
selected, ask only about the requested change; do not repeat the create brief.

## 2. Resolve the app and bootstrap missing anchors

Work from the user's project. Resolve this skill's directory from this `SKILL.md`
file location, never from the process working directory. Bootstrap files live at
`templates/bootstrap/`; reusable presentation and step examples live at
`templates/presentation/` and `templates/step/`.

Check these three contracts, allowing equivalent names and implementations:

1. **Build setup:** a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit:** a typed Step/Scene contract, active-step stage/host with entity
   morph support, present/browse navigation and chrome, and fit-scaled canvas.
3. **Presentation index:** explicit or equivalent route registration that lets
   multiple presentations coexist.

If all anchors exist, preserve and use them. Otherwise choose the target before
writing: empty or standalone projects use their root; a monorepo (workspace
configuration, `pnpm-workspace.yaml`, or `packages/`/`apps/` layout) gets a
self-contained app under `presentations/`. In a non-empty project missing
scaffolding, state the target directory and ask the user to confirm before
writing. Preserve unrelated files and every existing anchor. Copy only missing
bootstrap parts from this skill's `templates/bootstrap/`, resolving those paths
relative to this skill file. Do not replace an existing build, kit, or index just
because its filenames differ.

Ensure the target app has the dependencies it needs, even if some are already
installed: runtime `react`, `react-dom`, `motion`, `lucide-react`; build and lint
dependencies `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
`@types/react-dom`, `@types/node`, and the ESLint stack; and `playwright` for
browser render checks. Update the target app's package manifest and lockfile and
install dependencies. Do not add Tailwind or another style framework unless the
host already uses it or the user requests it.

The reusable kit and its bootstrap copy must remain style-neutral: no palette,
fonts, spacing system, borders, shadows, card/button styling, or theme tokens.
Put the visual design in presentation-owned CSS (plain CSS by default).

## 3. Create or modify

For a new presentation, make a self-contained directory under
`src/presentations/<slug>/` (or the equivalent app layout) with `Talk.tsx`,
`entities.ts`, `steps/`, and presentation-owned CSS. Use the examples in
`templates/presentation/` and `templates/step/` as scaffolds, replacing their
placeholders. Keep IDs stable for the same real entity across steps, make each
step's content and visual change legible, and provide a useful title and caption
for every step. Register the new slug and lazy route in the presentation index.
Never overwrite or unregister existing presentations.

For a modification, edit only the selected presentation and the necessary
registration or verification files. Preserve other presentations and scope the
change to the requested steps, entities, or style.

## 4. Verify and inspect

From the app root, run `npm run build` and
`npm run verify -- <slug>` for the new or changed presentation. Fix failures
and repeat; never report success while either fails. `verify` builds the app and
opens the requested route in a browser to confirm its first step renders
without console or runtime errors. If the project-local screenshot helper is
available, run `npm run inspect -- <slug>` after the build. Otherwise create any
temporary Playwright helper under the project root and remove it when finished.

Inspect settled browser screenshots of the first and last steps and every dense
or key step. Use a narrow viewport too when the composition is responsive
sensitive. Confirm the fixed scene canvas fits, captions and controls do not
collide with important content, and text remains readable. Review all helper
warnings: fix accidental overlap and weak active-step or attribution styling;
mark only an intentional, readable overlap with the kit's allow-overlap hook.
After a visual fix, rebuild and repeat the relevant render and inspection checks.

## 5. Report completion

Summarize the created or changed presentation and route, the checks run, and any
remaining advisory warnings. Report only checks actually completed.

Use this concise format:

```text
Presentation: <name> (<route>)
Changes: <brief summary>
Checks: <commands and results>
Advisory warnings: <None or remaining warnings>
```

---
name: presentation
description: Creates or modifies browser presentations that work as one evolving diagrammatic scene (stable entities that appear, move, connect, and re-label across named steps). Use when asked to make, build, or change a presentation, talk, or slide-style explainer for a topic.
---

# Presentation

A presentation is one scene moving through named steps, not a deck of separate
slides. Entities keep a stable identity and morph in place from step to step. A
reusable, style-neutral React scene kit provides motion, navigation, and chrome;
each presentation owns its entities, steps, and look.

All paths below named `scripts/` or `templates/` are relative to the directory
that contains this `SKILL.md`, never to the current working directory. Resolve
that directory first and use absolute paths. The helper script is
`<skill-dir>/scripts/scaffold.mjs`.

## Workflow

Choose create or modify from the request.

- **Create:** 1 Gather, 2 Resolve the target and scaffold, 3 Generate, 4 Self-verify.
- **Modify an existing presentation:** 2 Resolve the target and scaffold (a no-op when all
  three anchors exist), then "Modify", then 4 Self-verify. Skip "Gather".

Always finish step 2 before creating or modifying anything.

### 1. Gather (create)

Ask the user for what is missing, **one question per message**, in this order:

1. the topic,
2. the visual style (the look, mood, palette, and typography direction),
3. for each step, its content (title and caption) and its visual description
   (which entities appear, move, connect, or change).

Never assume a detail the user can still provide: if the prompt omits the topic,
the style, or the step descriptions, ask. Wait for each answer before asking the next.

- **Prompt already complete.** If the prompt already contains the topic, the style,
  and all step details, skip the questions and go straight to building.
- **Partial detail.** The user decides how much to specify. If they choose to build
  with only some details (for example "just sketch a few steps and let me see it"),
  build from what you captured and iterate afterwards. There is no completeness gate:
  never refuse to build, and never send them back to answer more questions once they
  have chosen to proceed.
- **ASCII mockups.** For a key or complex step you may draw an ASCII mockup of its
  layout and ask the user to confirm it before building. It is optional and
  selective: do not mock up every step.

### 2. Resolve the target and scaffold what is missing

Three contract anchors must exist in the target app:

1. **Build setup**: a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit**: the reusable engine (`Step`/`SceneProps` contract, `Stage`,
   `Presentation` with navigation and chrome, fit-scaled canvas).
3. **Presentation index**: `src/presentations/index.ts`, the explicit registry that
   maps each presentation to its own route.

Detection is by capability, not byte-identical files, so cosmetic differences
(file names, formatting, extra dependencies) do not trigger re-scaffolding.

Run the helper for the project directory the user is working in:

```bash
node <skill-dir>/scripts/scaffold.mjs scaffold <project-dir> --no-install
```

It prints JSON with `status`, `target`, and `missing`:

- **Target.** Already inside a presentation app (kit or index present) means that app
  is the target. A monorepo (a `workspaces` field in `package.json`, a
  `pnpm-workspace.yaml`, or a `packages/` or `apps/` directory) gets a self-contained
  app in `presentations/` and its root is never modified. Any other project, empty or
  standalone, is scaffolded at its root.
- **`already-scaffolded`**: all anchors exist. Skip scaffolding and go on to create or modify.
- **`needs-confirmation`**: the project is non-empty and lacks the kit or the index.
  Nothing has been written. State the target path and the files it would add to the user,
  and **wait for their explicit confirmation** before running the command again with
  `--confirm`. Do not treat silence or an earlier unrelated "yes" as confirmation.
- **Empty directory, or none of the anchors present:** a full scaffold. Partial
  scaffold: only the missing anchors are added and existing files are never overwritten.
  If `needsRouteWiring` is true, an existing entry file kept its content, so edit it to
  render `src/Router.tsx` yourself.

Do not assume dependencies are installed. After scaffolding run `npm install` in the
target (the full set: react, react-dom, motion, lucide-react, vite, @vitejs/plugin-react,
typescript, @types/*, the ESLint stack, and playwright), then `npx playwright install chromium`
if Chromium is missing. The scaffold is styling-framework-neutral: do not add Tailwind or
any other framework unless the host project already uses one or the user asks for it.

### 3. Generate

Each presentation is its own folder `src/presentations/<slug>/` with `entities.ts`
(its `layoutId` namespace), `steps/*`, a `Talk.tsx` entry, and its own stylesheet.

```bash
node <skill-dir>/scripts/scaffold.mjs create <app-dir> <slug> "<Title>"
```

copies `templates/presentation/` into a new folder and appends one entry to the
registry; it refuses to touch an existing slug. Existing presentations are never edited
or removed: the registry only gains a line. Then:

- Write the steps as typed data: each has a stable `id`, an `era`, a one-line `title`,
  a browse `caption`, and a diagram state (a Scene component plus payload). Step numbers
  come from position.
- Steps that are successive states of the same diagram share a `groupKey` and Scene, so
  the scene stays mounted and entities morph in place. Wrap only newcomers in `Appear`.
  Keep intentional overlaps and stacks as designed.
- Compose the kit's primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
  `SymbolChip`) or raw `motion` elements with a stable `layoutId`.
- **Styling belongs to the presentation.** Write plain CSS in the presentation's own
  folder (or the host app's CSS) from the visual direction gathered. Never put colors,
  fonts, borders, shadows, or button styles in the scene kit. Use another styling system
  only when the host already uses one or the user asked for it.
- Style the active progress and table-of-contents entries
  (`[data-presentation-active="true"]`) so the current step is visibly distinct, and
  style `[data-presentation-attribution]` (the default "made by and-scene" link,
  bottom-right) so it is legible: at least 11px and not the browser-default link look.

### Modify

When asked to change a presentation:

1. If the target is unspecified or ambiguous, run
   `node <skill-dir>/scripts/scaffold.mjs list <app-dir>`, list the existing
   presentations, and ask which one. Change nothing until the target is identified.
2. Once identified, ask only about the requested changes (steps, entities, or style).
   Do not restart the create questions and do not scaffold over existing
   infrastructure (step 2 reuses anchors that exist). Edit only that presentation's files;
   touch the registry or verification files only when needed.

### 4. Self-verify before reporting completion

Run this after every create and every modify. Never report success while the build, the
render check, or the visual composition check fails: fix the cause and re-run that check.

1. **Build:** `npm run build` must pass with no type errors.
2. **Render:** `npm run verify` builds the app, checks the reference sample, and
   renders every registered presentation (including the one you created or modified)
   through all steps in Chromium with no console or page errors.
3. **Visual composition:** run the project-local screenshot helper, which waits for
   animations to settle before each capture:

   ```bash
   npm run inspect -- <slug>            # add --viewport 390x844 for a narrow pass
   ```

   Prefer it over ad hoc scripts. If it is missing, write any temporary Playwright
   script **under the project root** so browser tooling resolves from local dependencies.
   Look at the screenshots of the first step, the last step, and the dense or key steps;
   for a responsive-sensitive presentation also capture a narrow viewport. Confirm that
   important content fits the 880 x 380 canvas, intentional overlaps stay readable, and
   content does not collide with captions, progress indicators, the table of contents, or
   navigation controls.
4. **Warnings:** the helper prints advisory `WARN step N: ...` lines (unmarked overlaps,
   indistinct active chrome, small or default attribution). Review each cited step. Fix
   accidental collisions and weak active or attribution styling, then re-run. Mark a
   subtree with `data-presentation-allow-overlap` only when the overlap is intentional
   and readable; never use it to silence a collision you have not judged readable. An
   empty warning list is not proof of a good composition, so still read the screenshots.

Report the checks you ran, their results, and any remaining advisory warnings accurately.

---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagrammatic scene (entities appear, move, connect and re-label across named steps). Use when the user asks for a presentation, talk, deck or slides about a topic, or wants to change an existing one. Scaffolds the Vite + React + TypeScript app and scene kit when missing, then builds, renders and visually checks the result.
---

# Presentation

A presentation is **one scene that evolves through named steps**, not a stack of unrelated slides. Entities keep a stable identity, so when a step changes they morph in place; entities that exist in only one of two adjacent steps animate in or out. Each step has an id, an era (section label), a one-line title for presenting, and a caption paragraph for browsing.

"Presentation" is the canonical term. If the user says "talk", treat it as a synonym (the per-presentation entry file is named `Talk.tsx`, which is incidental).

## Locating this skill's files

`SKILL_DIR` is the directory that contains this `SKILL.md`. Resolve every template and helper path from it (`$SKILL_DIR/templates/bootstrap/`, `$SKILL_DIR/templates/presentation/`, `$SKILL_DIR/scripts/cli.mjs`). Never look for them relative to the current working directory, which is the user's project.

## Procedure

Follow the steps in order. Do not report completion until step 5 has passed.

### 1. Gather what to build

Ask the user for what is missing, **one question at a time**, waiting for each answer before asking the next:

1. the **topic**,
2. the **visual style** (mood, palette, typography, density),
3. for each step, its **content** and a **visual description** of the scene at that step.

Rules:

- Do not assume or invent details the user can still provide. Ask first.
- The user controls the depth. If they choose to build after giving only some details (for example a topic and two steps), accept that choice: generate from what you have, with no completeness gate, and offer to iterate afterwards.
- If the prompt already contains the topic, the style and every step's details, proceed without further questions.
- When a step's layout is key or complex, you may draw an ASCII mockup of it and ask the user to confirm the layout before building. Do this only where it helps, not for every step.

When the request is to modify an existing presentation, skip to "Modify" below instead of running this whole interview.

### 2. Resolve the target and scaffold what is missing

A project is ready for presentations when it has all three **contract anchors**. Detect them by contract, not by an identical scaffold, so cosmetic differences (file names, formatting, extra dependencies) never trigger re-scaffolding:

1. **Build setup**: a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit**: the reusable engine under `src/presentation-kit/`: the `Step`/`Scene` step contract, the stage that mounts the active step and runs entity morphs, present/browse navigation, the chrome (captions, table of contents) and the fit-scale canvas.
3. **Presentation index**: `src/presentations/index.ts`, the explicit registry mapping each presentation to its own route so several coexist.

Run the detector instead of guessing:

```bash
node "$SKILL_DIR/scripts/cli.mjs" detect --project <project directory>
```

It prints the resolved target, which anchors exist, which are missing, and whether you must confirm first.

**Resolve the target location**

- Already inside a presentation app (kit or index present): use that app and scaffold only what is missing.
- Monorepo (any of: a `workspaces` field in the root `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/` directory): scaffold a self-contained app in a `presentations/` directory. Do not mutate the monorepo root or its unrelated content.
- Empty or standalone (non-monorepo) project: scaffold at the project root.

**Confirm before writing in a non-empty project.** If the project is non-empty and lacks the scene kit or the presentation index, state the exact target path you will scaffold into and why, and proceed only after the user confirms. In an empty directory no confirmation is needed.

**Scaffold**

- None of the anchors present: do a full scaffold (build setup, scene kit and presentation index) and install the dependencies before creating the presentation.
- All three present: skip scaffolding and go straight to step 3.
- Some present: scaffold only the missing anchors and their dependencies, without overwriting or disturbing the ones already present.

```bash
node "$SKILL_DIR/scripts/cli.mjs" scaffold --project <project directory> [--target <resolved target>] --install
```

The command copies from `$SKILL_DIR/templates/bootstrap/`, never overwrites an existing file (the verification and inspection scripts are copied whenever the package scripts that call them are added), adds only missing dependencies and scripts to an existing `package.json`, and with `--install` runs `npm install`. If the output lists `integration` files (an existing `src/main.tsx`, `src/index.css` or `index.html` that were kept), wire the existing entry point to the scaffolded `src/Router.tsx` by hand and tell the user. Never assume the dependencies are installed. The scaffold needs `react`, `react-dom`, `motion`, `lucide-react`, `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack, and `playwright` (for the render check and screenshots; run `npx playwright install chromium` if no browser is available).

The scaffold is **styling-framework neutral** and ships **zero presentation styling defaults**: no Tailwind, no default theme, colors, fonts, card or button styles. Do not add Tailwind or another framework unless the host project already uses one or the user explicitly asks for it.

### 3. Create a new presentation

```bash
node "$SKILL_DIR/scripts/cli.mjs" create --project <project directory> [--target <resolved target>] --slug <slug> --title "<title>"
```

This writes `src/presentations/<slug>/` from `$SKILL_DIR/templates/presentation/` and appends one entry to the registry. It refuses, changing nothing, if the slug or folder already exists, so an existing presentation is never replaced; pick another slug in that case. Never delete or rewrite other presentations' folders or registry entries.

Then author the presentation:

- `entities.ts`: this presentation's `layoutId` namespace. One stable id per entity; prefix ids with the slug.
- `steps/*.ts`: one `Step` object per step with `id`, `era`, `title`, `caption`, `Scene`, `groupKey` and a typed `payload`. Steps that share a `groupKey` and `Scene` keep one scene instance and only the payload changes, which is what lets persisting entities morph. Step numbers are derived from position; never write them.
- `Talk.tsx`: `<Presentation steps={STEPS} title=… initialMode="browse" />`.
- Compose the scene from the kit's primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`) or raw `motion` elements with a stable `layoutId`. The design canvas is 880 × 380. Keep entities from earlier steps in later steps so they morph instead of being redrawn; wrap only genuinely new entities in `Appear`.
- Mark an intentional, readable overlap with the `data-presentation-allow-overlap` attribute on that entity.

**Style belongs to the presentation.** The kit has zero visual defaults and exposes stable `data-presentation-*` hooks. Put the look in plain CSS inside the presentation's own folder (host-owned CSS is also fine). Use another styling framework only when the host already uses it or the user explicitly requests it. Never put colors, fonts, borders or button styles in `src/presentation-kit/`. In the presentation's CSS, make the active step visibly distinct (`[data-presentation-progress-dot][data-presentation-active="true"]`, `[data-presentation-toc-entry][data-presentation-active="true"]`) and make the attribution (`[data-presentation-attribution]`) legible: explicit size of at least 11px, colour and font, not the browser-default link look.

### Modify an existing presentation

1. Identify the target. If the user did not name one, or the name is ambiguous, list the existing presentations (the registry in `src/presentations/index.ts`) and ask which to modify **before changing anything**.
2. Once identified, ask only about the requested changes (steps, entities or style). Do not re-run the full interview in step 1.
3. Edit that presentation in place; change nothing else except registration or verification artifacts that must follow. Then run step 5.

### 4. Quality bar

Every presentation you hand back must: build with no type errors; render its first step with no runtime or console errors; show a caption on every step; support next and previous navigation; pass the visual composition check; and follow the evolving-scene model above.

### 5. Self-verify before reporting completion

Run these in order against the generated or modified presentation, and fix failures yourself:

1. `npm run build`: no type or build errors anywhere in the app.
2. Render check: at minimum the first step renders with no runtime or console errors. `npm run verify` builds, then steps through every step of every registered presentation in Chromium against a production preview on `127.0.0.1`, failing on any console error, page error or step that does not advance. A lighter build plus a single-route render may run first while iterating; run the full `npm run verify` before you finish.
3. Visual composition check: capture settled screenshots with the **project-local helper** and look at them.

   ```bash
   npm run inspect -- <slug>                              # 1440x900 into inspection/<slug>/step-NN.png (NN is the zero-based step index)
   npm run inspect -- <slug> --viewport 390x844 --out inspection/narrow
   ```

   Look at the first step, the last step and the dense or key steps; if the presentation is responsive-sensitive, check a narrow viewport too. Confirm that important content fits the fixed canvas, intentional overlaps remain readable, and nothing collides with chrome (captions, progress indicators, table of contents, navigation controls). Prefer the project-local helper over ad hoc scripts outside the project, so the browser tooling resolves from local dependencies and screenshots are taken after animations settle. If the helper is unavailable, write any temporary Playwright script **under the project root**, never outside it.
4. Review every advisory warning the helper prints (`WARN step <index> <kind>: …`). Open the referenced steps. Fix accidental text or chrome collisions, indistinct current-step chrome and unpolished attribution, then re-capture and recheck. Add `data-presentation-allow-overlap` only to a subtree whose overlap is intentional and readable; never mark an accidental collision or an illegible overlap as allowed just to silence a warning. Warnings are advisory and do not fail the command, so you must read them.

If the build, the render check or the visual composition check fails, fix the issue and re-run the checks. **Never report success while any check fails.** In your final report, state which checks ran, their outcome, and any remaining advisory warnings accurately.

Screenshots and `node_modules`/build output are generated artifacts: do not commit them.

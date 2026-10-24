---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagram (stable entities that appear, move, connect, and re-label across named steps). Use when the user wants a presentation, talk, or explainer built from a topic, or wants to change an existing one.
---

# Presentation

Build browser presentations as **one evolving scene**, not a deck of slides. A
presentation is a list of ordered, named steps; entities keep a stable identity
across steps and morph in place. "Presentation" is the canonical term ("talk" is
only an informal synonym; the per-presentation entry file is `Talk.tsx`).

The reusable engine is the **scene kit** (`src/presentation-kit/`). The kit owns
behaviour, fixed-canvas geometry, navigation, and stable `data-presentation-*`
hooks. It has **zero styling defaults**: every presentation owns its colours,
typography, spacing, and component treatments.

## Where things live

Everything this skill ships sits next to this `SKILL.md`. **Resolve every template
and script path relative to the directory containing this file**, never relative to
the current working directory (call it `$SKILL_DIR`):

| Path | Purpose |
|---|---|
| `$SKILL_DIR/scripts/scaffold.mjs` | detect anchors, resolve the target, scaffold missing pieces, create a presentation |
| `$SKILL_DIR/templates/bootstrap/` | the app scaffold (build setup, scene kit, presentation index, verification scripts) |
| `$SKILL_DIR/templates/presentation/` | one presentation: `entities.ts`, `Scene.tsx`, `steps/*`, `Talk.tsx`, `talk.css` |

## Procedure

Work through the four phases in order. Do not report success until phase 4 passes.

### 1. Gather

Ask the user for what is missing, **one question at a time**, never several at
once and never assuming something the user can still tell you:

1. the **topic** (and audience, if it changes the story),
2. the **visual style** (mood, palette, typography direction),
3. for each step, its **content** (title and caption) and its **visual description**
   (which entities appear, move, connect, or change).

The user controls the depth. If they choose to build with only some details, say
what you will fill in yourself and proceed, with no completeness gate; they can
iterate afterwards. If the prompt already contains the topic, the style, and every
step's content and visual description, skip the questions and build.

For a key or complex step you may draw an **ASCII mockup** to confirm the layout
before building. This is optional and discretionary; do not mock up every step.

If the request is to change an existing presentation, follow **Modify** below
instead of the full interview.

### 2. Resolve the target and scaffold what is missing

Run, from anywhere:

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" resolve <project-dir>
```

It reports the three **contract anchors** and where the scaffold belongs:

1. **Build setup**: a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit**: the engine (the `Step`/`Scene` contract, the stage that mounts the
   active step and runs entity morphs, present/browse navigation, chrome, and the
   fit-scaled canvas).
3. **Presentation index**: the registry mapping each presentation to its own route.

Detection is by contract (what the project provides), not by exact file names or
formatting, so cosmetic differences and extra dependencies never trigger
re-scaffolding.

Target resolution:

- Empty or standalone (non-monorepo) project: scaffold at the project root.
- **Monorepo** (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a
  `packages/` or `apps/` directory) with no presentation app yet: scaffold a
  self-contained app under `presentations/`; never modify the monorepo root.
- Already inside a presentation app (kit or index present, at the root or in
  `presentations/`): use it.

Then decide:

- All three anchors present: skip scaffolding; go to phase 3.
- Some missing: scaffold only the missing anchors; existing files are never
  overwritten.
- If the report says `needsConfirmation` (the project is non-empty and lacks the
  scene kit or presentation index, including a non-empty project with no anchors at
  all), **state the target directory you will write into and wait for the user to
  confirm before copying or installing anything.** Do this for the full and the
  partial scaffold alike. An empty directory needs no confirmation.

Scaffold and install dependencies (never assume they are already installed). `apply`
refuses to write into a non-empty project until it is re-run with `--confirm`, which
you pass only after the user has agreed to the target you stated:

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" apply <project-dir> [--confirm] --install
```

The scaffold needs React, React DOM, Motion, Lucide icons, Vite, the React Vite
plugin, TypeScript with `@types/react`, `@types/react-dom`, `@types/node`, ESLint,
and Playwright (render verification). `apply` adds whichever are missing to an
existing `package.json` and runs `npm install`; install Playwright's Chromium with
`npx playwright install chromium` if it is not available. The scaffold is
**styling-framework-neutral** and ships no colours, fonts, spacing, cards, buttons,
borders, shadows, or theme tokens. Add Tailwind or another framework only when the
host project already uses one or the user explicitly asks for it, and configure it
in the presentation or host app, never in the kit.

### 3. Generate or modify

**Create.** Make the presentation a self-contained unit with its own route:

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" create <target> <slug> "<Title>"
```

This copies `templates/presentation/` to `src/presentations/<slug>/` and appends
one entry to the explicit registry `src/presentations/index.ts` (other entries are
left untouched, so existing presentations stay intact and reachable). Then replace
the placeholder content:

- `entities.ts`: this presentation's `layoutId` namespace and one rectangle per
  entity (design canvas is 880 x 380). Entities accumulate and morph; do not
  rearrange or redraw them between steps.
- `steps/*.tsx`: one `Step` per beat, with a stable `id`, an `era` (table-of-contents
  section), a one-line `title`, a paragraph `caption`, a `groupKey` shared by steps
  of the same evolving diagram, and a typed `payload`. Step numbers come from
  position; never number steps by hand.
- `Scene.tsx`: renders the payload with kit primitives (`Box`, `Label`, `Arrow`,
  `Frame`, `Emphasis`, `SymbolChip`, `SceneLayer`). Wrap **newcomers** in `Appear`
  so they enter after persisting entities settle; entities that continue across
  steps keep the same `id` and are not re-faded. Preserve intentional stacking and
  literal coordinates; mark a deliberate, readable overlap with
  `data-presentation-allow-overlap` on that subtree only. When a primitive is the
  wrong shape, use a raw `motion` element with a stable `layoutId`.
- `talk.css`: **the presentation's own styling**, imported from `Talk.tsx`. Plain
  CSS is the default. Style the kit's hooks: `[data-presentation-node=...]`,
  `[data-presentation-title]`, `[data-presentation-caption]`,
  `[data-presentation-progress-item]`, `[data-presentation-toc-item]`,
  `[data-presentation-prev]`, `[data-presentation-next]`,
  `[data-presentation-attribution]`. Make the **active** progress/ToC entry
  (`[data-presentation-active="true"]`, `aria-current="step"`) visibly distinct and
  the bottom-right attribution legible. Never put styling in the kit.

### 4. Self-verify (do not skip, do not report success while anything fails)

Order matters. While iterating you may use the lighter checks; completion requires
the full gate.

1. **Build**: `npm run build` must finish with no type errors.
2. **First-step render of the actual route**: `npm run verify -- <slug>` builds,
   checks the registration, opens `/<slug>` on `127.0.0.1` in Chromium, and steps
   every step, failing on any console error, page error, or step that does not
   advance. (For the committed reference presentation, plain `npm run verify`.)
3. **Visual composition check**: use the project-local screenshot helper, not an ad
   hoc script outside the project tree:
   `npm run inspect -- <slug>`. It builds, serves the production preview, waits for
   each transition to settle, and writes `inspection/<slug>/step-NN.png` plus
   advisory warnings. If the helper is missing, write any temporary Playwright
   script **under the project root** so it resolves local dependencies.
   Look at the **first step, the last step, and every dense or key step**. For a
   responsive-sensitive presentation also capture a narrow viewport
   (`npm run inspect -- <slug> --viewport 390x844`). Judge for yourself that the
   important content fits the canvas, intentional overlaps stay readable, and nothing
   collides with the caption, progress dots, table of contents, or navigation.
4. **Review every warning** the helper prints (overlap, indistinct active chrome,
   attribution). Fix accidental collisions and weak chrome styling in the
   presentation's CSS; add `data-presentation-allow-overlap` only to a subtree whose
   overlap is intentional and readable, never as a blanket suppression. Re-run the
   helper after each fix. Warnings are advisory evidence for you to review; they do
   not by themselves prove the composition is good, and a clean helper run does not
   replace looking at the screenshots.
5. **Fix and re-check.** If the build, render, or visual check fails, fix the cause
   and run the failing check again. Repeat until it passes.
6. **Completion gate**: run the full `npm run verify` (and `npm run verify -- <slug>`
   for the new or modified presentation) once more after the last change. Report
   success only when it passes, and say honestly what remains advisory.

## Modify an existing presentation

1. If the user did not clearly name the target (or the name is ambiguous), **list the
   registered presentations** (from `src/presentations/index.ts`) and ask which one to
   modify **before changing anything**.
2. Once identified, ask only about the requested changes (steps, entities, or style).
   Do not re-run the topic/style/step interview.
3. Edit only that presentation's folder (plus its registry line if its slug or title
   changes). Other presentations stay byte-for-byte unchanged. Scaffold checks must
   not restart the interview or overwrite existing anchors.
4. Run phase 4 in full.

## Quality bar

Every presentation builds with no type errors, renders its first step without
runtime or console errors, shows a caption per step in browse mode, supports
next/previous navigation (keys, swipe, controls, progress dots, table of contents),
passes the visual composition check, and conforms to the evolving-scene model.

## Kit reference

- `Presentation` props: `steps`, `title`, `initialMode` (`'browse'` default or
  `'present'`), `brand` (top-left, opt-in), `attribution` (default "made by
  and-scene" bottom-right link; `null` removes it), `canvas`, `className`.
- Keys: Right/Space/PageDown next, Left/PageUp previous, `P` toggles present/browse.
  Navigation clamps at both ends. Focused controls keep their own keys.
- Test hooks on the root: `data-step-count`, `data-step-index`, `data-mode`.

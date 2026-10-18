---
name: presentation
description: Creates or modifies a browser-based presentation that works as one evolving diagram (entities appear, move, connect and re-label across named steps). Use when asked to make, build, edit, or extend a presentation, talk, or slide-style explainer from a topic.
---

# Presentation

A presentation is **one scene moving through named steps**, not a deck of separate slides. Entities
keep a stable id, so between steps they move, resize, re-label, enter and leave in place. The
reusable engine is the scene kit; each presentation supplies only its own entities, steps, and look.

This file lives at `skills/presentation/SKILL.md`. Resolve **every template path relative to the
directory of this file** (`<skill-dir>`), never relative to the working directory:

- `<skill-dir>/templates/bootstrap/` — a complete app snapshot (build setup, scene kit, presentation index, scripts, lock file)
- `<skill-dir>/templates/presentation/` — the files of one new presentation
- `<skill-dir>/scripts/scaffold.mjs` — `detect`, `scaffold` and `new` helpers that apply those templates

Run the helper with its absolute path, for example `node <skill-dir>/scripts/scaffold.mjs detect .`.

## 1. Decide: create or modify

If the user wants to change an existing presentation, follow **Modify** (step 6). Otherwise continue.

## 2. Gather

Ask the user questions **one at a time**, in this order, and wait for each answer:

1. the **topic** (and audience, if it changes the story);
2. the **visual style** (mood, palette, typography, density);
3. for each step: its **content** (what is said) and its **visual description** (which entities appear, move, connect or change).

Rules:

- Do not invent details the user can still supply. Ask for what is missing instead of assuming it.
- Skip any question the prompt already answers. If the prompt already contains the topic, the style
  and every step's details, **proceed to build without further questions**.
- The user decides how deep to go. Offer "build with what we have": if they choose it after giving only
  some details, generate from what was captured, state the assumptions you made, and invite iteration.
  There is no completeness gate.
- For a key or complex step you may draw an **ASCII mockup** of its layout and ask whether it matches
  before building. Use it only where it helps; do not mock up every step.

## 3. Resolve the target and scaffold what is missing

Run `node <skill-dir>/scripts/scaffold.mjs detect <project-dir>`. It reports the three contract anchors
and the resolved target. Detection is by capability, not by byte-identical files, so renamed files,
formatting differences and extra dependencies are fine and must not trigger re-scaffolding:

1. **Build setup** — a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit** — the presentation-agnostic engine: the `Step`/`Scene` contract, the stage that mounts
   the active step and runs entity morphs, present/browse navigation, chrome (captions, table of
   contents) and the fixed-canvas fit scale.
3. **Presentation index** — the registry mapping each presentation to its own route.

Target resolution:

- Empty directory or standalone (non-monorepo) project: scaffold at the **root**.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/`
  directory): scaffold a self-contained app in a **`presentations/`** directory; never mutate the
  monorepo root's infrastructure.
- Already inside a presentation app (kit or index present): use it and scaffold only the missing anchors.

Then:

- **All anchors present:** skip scaffolding and go to step 4.
- **Some missing:** scaffold only the missing anchors (and their dependencies); never overwrite files or
  dependency entries that exist.
- **None present:** scaffold everything.
- **Non-empty project:** before any write or install — including when only the build setup is missing —
  state the resolved target and what will be added, and **wait for the user's confirmation**. Skip the
  confirmation only for an empty directory and for an already-scaffolded project.

Scaffold with `node <skill-dir>/scripts/scaffold.mjs scaffold <project-dir> [--confirm] [--install]`
(`--confirm` only after the user agreed). Do not assume any dependency is installed: the scaffold installs
`react`, `react-dom`, `motion`, `lucide-react`, `vite`, `@vitejs/plugin-react`, `typescript` with
`@types/react`, `@types/react-dom` and `@types/node`, the eslint stack, and `playwright` (render checks;
run `npx playwright install chromium` if no browser is available). Where a file such as
`src/main.tsx` already exists it is kept; wire in `AppRouter` by hand.

The scaffold is **styling-framework-neutral** and ships no presentation styles. Never add Tailwind or
another framework unless the host project already uses one or the user asks for it.

## 4. Create a presentation

Run `node <skill-dir>/scripts/scaffold.mjs new <target> <slug> "<Title>"`. This writes a self-contained
folder `src/presentations/<slug>/` and appends **one** line to the registry in
`src/presentations/index.ts` (append only; never edit other presentations' files or entries).
The presentation is then served at `/<slug>`.

Fill in the generated files:

- `meta.ts` — each step's stable `id`, `era` label, one-line `title`, and browse `caption`.
- `entities.ts` — the presentation's `layoutId` namespace (stable entity ids).
- `steps/` — the Scene(s) composed from kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
  `SymbolChip`, `Appear`, `SceneLayer`), or raw `motion` elements with stable `layoutId`s when coordinates are
  literal. Successive states of one diagram share a `groupKey` and Scene component so the scene
  stays mounted and entities morph. Wrap **only newcomers** in `Appear`; persisting entities keep their
  position and id. Preserve intentional overlap or stacking rather than flattening it, and mark a readable,
  intentional overlap with `data-presentation-allow-overlap` on that subtree only.
- `Talk.tsx` and `talk.css` — the entry component and the presentation's **own plain CSS**. The kit has zero
  visual defaults, so the look (colors, fonts, spacing, borders, shadows, buttons) lives in `talk.css`
  (or the host's CSS). Style the stable hooks: `[data-presentation-active]` on progress and table-of-
  contents items, `[data-presentation-attribution]`, `[data-presentation-node]`, and the others. Never add
  visual styling to `src/presentation-kit/`.

## 5. Self-verify before reporting done

Check the presentation you created or modified (its own route, not only the reference sample):

1. `npm run build` — no type or build errors.
2. Render check — at least the first step renders with no runtime or console errors; `npm run verify`
   renders every registered presentation through every step and is the full completion gate.
3. Visual composition — run the project-local helper `npm run inspect -- <slug>` (prefer it over ad hoc
   scripts; if it is unavailable, write any temporary Playwright script **under the project root** so
   dependencies resolve locally). It writes settled screenshots to `.inspection/<slug>/`. Look at the
   **first step, the last step, and every dense or key step**; for a responsive-sensitive presentation
   also run it with `--viewport 390x844`. Confirm important content fits the fixed canvas, intentional
   overlaps stay readable, and content does not collide with the caption, progress, table of contents or
   navigation.
4. Review every `WARN` the helper prints. Fix accidental collisions, give the active progress and
   table-of-contents entries a visibly distinct style, and style the attribution so it is legible
   (at least 12px, not browser-default). Mark an overlap with `data-presentation-allow-overlap` only when it is
   genuinely intentional and readable; never mark an accidental collision or the whole scene to silence a
   warning. Re-run the helper afterwards.

If any check fails, **fix it and re-check**. Never report success while a build, render or visual check is
failing. Report the final results and any remaining advisory warnings accurately.

Every presentation must build clean, render its first step without errors, show a caption per step,
support next/previous navigation, pass the visual check, and follow the evolving-scene model.

## 6. Modify an existing presentation

1. If the user did not name the target clearly, **list the existing presentations** (from
   `src/presentations/index.ts`) and ask which to modify. Change nothing — no edits, scaffold writes, or
   installs — until it is identified.
2. Run the anchor check of step 3 (and any confirmed repair) before editing, exactly as for create.
3. Ask only about the requested changes (steps, entities, or style) — do not re-walk the full create flow.
4. Edit that presentation in place; leave other presentations untouched apart from necessary
   registration or verification artifacts.
5. Run the self-verification of step 5 on the modified route.

---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagram (stable entities moving through named steps), scaffolding the Vite + React + TypeScript app and scene kit when they are missing. Use when asked to make, build, add, or change a presentation, talk, or evolving-diagram deck from a topic.
---

# Presentation

Build a browser presentation as **one evolving scene**: entities keep a stable identity and
morph, appear, or leave as the explanation moves through ordered, named steps. It is not a
deck of unrelated slides. "Presentation" is the only artifact name; `Talk.tsx` is just the
entry-component filename.

All paths below that start with `templates/` are relative to **the directory containing this
`SKILL.md`**, never to the current working directory. Resolve that directory first and use
absolute paths when copying.

## Procedure

### 1. Gather requirements

Ask the user **one question at a time**. Never assume what the user can still tell you.
Cover, in this order, whatever the prompt has not already supplied:

1. the topic (and audience, if it changes the story),
2. the visual style (mood, palette, typography, density),
3. for each step: the narration (era/section label, one-line presenter title, browse caption
   paragraph) **and** a description of what the diagram shows, which entities appear, move,
   re-label or leave.

The user decides how much to specify. If they choose to build with partial detail, proceed with
what you have and iterate afterwards; do not enforce a completeness gate. If the prompt already
contains the topic, style and every step, skip straight to building. For a key or complex
step you may sketch an ASCII mockup and ask the user to confirm the layout. Do not mock up
every step.

When *modifying* a presentation, skip this full interview (see "Modify").

### 2. Detect the contract anchors

A project can host presentations when it has all three anchors. Detect them by contract, not by
byte-identical files; renamed files, formatting, and extra dependencies do not matter.

1. **Build setup**: a `package.json` with a working `build` script plus Vite, React and
   TypeScript.
2. **Scene kit**: a directory exporting the `Step`/`Scene` types, the stage that mounts the
   active step and runs entity morphs, the `Presentation` host with present/browse navigation,
   the chrome (captions, table of contents) and the fit-scaled canvas.
3. **Presentation index**: a registry module that maps each presentation to its own route.

### 3. Resolve the target

- Already inside a presentation app (its anchors present): use it and scaffold only what is missing.
- Empty or standalone (non-monorepo) project: the app lives at the repository root.
- Monorepo (`workspaces` in `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/`
  layout): create a **self-contained app under `presentations/`** with its own package, build
  setup, kit and index. Never modify the monorepo root's `package.json`, lockfile, or config.

### 4. Confirm, then scaffold what is missing

If the project is **not empty** and any anchor is missing, state the resolved target location
and the anchors you will add, and **wait for the user to confirm before writing anything or
installing dependencies**. An empty directory needs no confirmation.

Then scaffold only the missing anchors from `templates/bootstrap/` (kit under
`src/presentation-kit/`, router, `Landing.tsx`, `src/presentations/index.ts`, `scripts/`,
`verify.config.json`, config files). Never overwrite files that are already present; merge
missing scripts and dependencies into an existing `package.json`. Do not assume any dependency is
installed: ensure `react`, `react-dom`, `motion`, `lucide-react`, `vite`, `@vitejs/plugin-react`,
`typescript` with `@types/react`, `@types/react-dom` and `@types/node`, the eslint stack, and
`playwright` (then run `npx playwright install chromium`), and run the package manager install.
For a fresh app, copy `templates/bootstrap/package-lock.json` too, so installs are reproducible.

The scaffold is **styling-framework neutral**: it ships no Tailwind, theme, colors, fonts, card
or button styles. Add a styling framework only if the host project already uses one or the user
explicitly asks for it.

### 5. Create a presentation

Copy `templates/presentation/` into `src/presentations/<slug>/` and replace the placeholders
`__SLUG__` (URL-safe, unique), `__TITLE__`, and `__NAMESPACE__` (identifier-safe `layoutId`
prefix). Then:

- `entities.ts`: the presentation's own stable entity ids, geometry, and the step each entity first appears at.
- `Scene.tsx` / `steps.ts`: one `Scene` shared by adjacent steps through a common `groupKey`, so
  the scene instance persists and only the step's payload changes. Wrap **only newcomers** in
  `Appear`; entities that continue across steps carry the same `id` (their `layoutId`) so they
  morph in place. Put every step's entities in a `SceneLayer`. Use `Box`, `Label`, `Arrow`,
  `Frame`, `Emphasis`, `SymbolChip`, or a raw `motion` element with a stable `layoutId` and
  literal coordinates. Keep intentional overlaps and stacks; do not flatten them.
- `talk.css`: **all visual styling**, plain CSS by default, targeting the kit's stable
  `data-presentation-*` hooks. The kit has zero visual defaults and you must never add colors,
  fonts, borders, shadows or theme tokens to `src/presentation-kit/`. Make the active progress and
  table-of-contents entry (`[data-presentation-active='true']`) visibly distinct and style the
  attribution link (`[data-presentation-attribution]`) so it is legible (readable size, deliberate
  color and font).
- Register it with **one added line** in `src/presentations/index.ts`:
  `{ slug, title, load: () => import('./<slug>/Talk') }`. Leave existing entries and folders
  untouched; they must stay reachable.

Mark a subtree whose text or chrome intentionally overlaps something with
`data-presentation-allow-overlap` (only genuinely intentional, readable overlaps).

### 6. Modify an existing presentation

Read the registry. If the user did not clearly name the target, **list the registered presentations
and ask which one** before changing anything. Once identified, ask only about the requested
changes (steps, entities, or style) and edit that presentation in place. Do not re-run the full
creation interview and do not touch other presentations beyond necessary registration.

### 7. Self-verify before reporting done

Never report success while any check fails. Fix the cause and re-check.

1. `npm run build` (type check + production build) must pass.
2. Render the new or modified route, first step at minimum, with no runtime or console errors.
   `npm run verify` builds the whole app and renders every registered presentation through every
   step in a real browser; run it before finishing.
3. Visual composition: run the project-local helper `npm run inspect -- <slug>`. It writes
   settled screenshots to `inspection/<slug>/step-NN.png` (1-based, 1280x720) and prints advisory
   warnings. Prefer it over ad hoc scripts; if you must write a temporary Playwright script,
   put it under the project root so browser tooling resolves from local dependencies. Look at
   the screenshots of the **first step, the last step, and every dense or key step**; for a
   responsive-sensitive presentation also check a narrow viewport (about 390px wide). Important
   content must fit the 880x380 canvas, intentional overlaps must stay readable, and content must
   not collide with captions, progress, table of contents or navigation.
4. Review each warning by step. Fix accidental text or chrome collisions, indistinct active
   chrome, and unpolished attribution in the presentation's CSS. Mark only an intentional,
   readable overlap with `data-presentation-allow-overlap`. Re-run the helper afterwards.

Warnings are advisory evidence for your review, never a pass signal on their own. Report the final
build, verify and inspection results and any advisory warnings that remain, accurately.

## Quality bar

Every presentation builds with no type errors; renders its first step with no runtime or console
errors; shows a caption per step and supports next/previous navigation; follows the evolving-scene
model above; and passes the visual composition check.

## Runtime reference

- Keys: Right/Space/PageDown next; Left/PageUp back; `P` toggles present/browse. Swipe left/right
  on touch. Navigation clamps at both ends and never steals keys from focused controls.
- Present mode shows the step marker and one-line title; browse mode adds caption, progress dots,
  prev/next, and (on viewports at least 1024px wide) the table of contents.
- Hooks: `data-presentation-root`, `-marker`, `-title`, `-caption`, `-toc-entry`, `-dot`,
  `-prev`, `-next`, `-attribution`, `-active="true"` (with `aria-current="step"`), and per-entity
  `data-presentation-entity`; `data-step-count` / `data-step-index` on the root.
- `<Presentation>` props: `steps`, `title`, `initialMode`, `canvas`, `attribution` (`false` or
  `{ label, href }`), `brand`, `className`. The default 880x380 canvas is scaled uniformly to fit.

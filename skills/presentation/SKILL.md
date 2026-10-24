---
name: presentation
description: Creates or modifies a browser presentation that is one evolving diagram (stable entities that appear, move, connect, and re-label across named steps). Use when the user wants a presentation, talk, or explainer built from a topic, or wants to change an existing one. Bootstraps the Vite + React + TypeScript scaffold and scene kit when missing.
---

# Presentation

Builds a presentation as **one scene that evolves through named steps**, not a deck of
separate slides. Entities have stable ids, so they morph in place from step to step.
"Presentation" is the canonical term; "talk" is an informal synonym (the per-presentation
entry component is `Talk.tsx` only by filename).

All paths below that start with `templates/` are relative to **the directory containing this
`SKILL.md`**, never to the current working directory. Resolve that directory first and use
absolute paths when copying.

## Scene model

- A presentation is an ordered list of steps. Each step has a stable `id`, an `era` (section
  label), a one-line `title` (present mode), a paragraph `caption` (browse mode), and the
  diagram state shown while it is active.
- Steps of one evolving diagram share a `groupKey` and one `Scene` component. The scene stays
  mounted; only `payload` changes. Entities that continue keep their `layoutId` and morph;
  newcomers go inside `<Appear>` (they fade in after the morph settles); departing entities
  are simply no longer rendered (the `SceneLayer` animates them out).
- Compose on the 880 × 380 design canvas. A persisting entity keeps its id and may move, resize,
  re-label, or change emphasis between steps (that is the morph); it need not stay put. Whether a
  scene accumulates or rearranges is the author's choice for the story being told. If a
  composition intentionally overlaps or stacks entities, keep it, and mark that subtree with
  `data-presentation-allow-overlap` only when the overlap is readable.
- Step numbers come from position; never number steps by hand.

## Styling ownership

The scene kit (`src/presentation-kit/`) has **zero styling defaults** and no styling-framework
dependency. Never add colors, fonts, borders, shadows, or CSS to the kit. Each presentation owns
its look in presentation-local plain CSS (`talk.css`) targeting the kit's `data-presentation-*`
hooks (`data-presentation-node`, `data-presentation-entity`, `data-presentation-dot`,
`data-presentation-toc-entry`, `data-presentation-active="true"`, `data-presentation-attribution`,
…). Use plain CSS unless the host project already uses another styling system or the user
explicitly asks for one (then add it in the presentation or host app, never in the kit). The
presentation's CSS must make the active progress dot and table-of-contents entry visibly distinct
and the bottom-right "made by and-scene" attribution legible. The top-left header brand is
opt-in via the `brand` prop; do not add one unless the host wants it.

## Procedure

### 1. Gather

Ask the user **one question at a time** for whatever is missing: the topic, the visual style, and
each step's content and visual description. Do not assume details the user can still provide.
The user controls the depth: if they choose to build with partial detail, build from what you have
without a completeness gate, and iterate afterwards. If the prompt already contains the topic,
style, and all step details, proceed without more questions. For a key or complex step you may
draw an ASCII mockup to confirm the layout before building; do not do this for every step.

### 2. Resolve the target and scaffold what is missing

Detect the three **contract anchors** by what they provide, not by byte-identical files:

1. **Build setup**: a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit**: the step/scene contract, stage host, present/browse navigation, chrome, and
   fit-scale canvas (canonically `src/presentation-kit/`).
3. **Presentation index**: the registry mapping each presentation to its own route
   (canonically `src/presentations/index.ts` plus the pathname router in `src/main.tsx`).

Resolve the target location:

- **Already inside a presentation app** (anchors present): use it.
- **Empty directory or standalone (non-monorepo) project**: scaffold at the project root.
- **Monorepo** (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or
  `apps/` layout): scaffold a self-contained app under `presentations/`, leaving the monorepo
  root untouched.

Then act on what is missing:

- **No anchors** (empty or unscaffolded): copy the whole `templates/bootstrap/` tree to the
  target, then run `npm install` (the template ships a lock file; use `npm ci` if the target has
  none of its own). The template includes a `starter` presentation you may delete or keep.
- **All anchors present**: skip scaffolding.
- **Some anchors present**: scaffold only the missing ones and their dependencies, without
  disturbing the others. Build setup files come from the bootstrap root (`package.json` scripts and
  dependencies are merged, not overwritten); the kit is `templates/bootstrap/src/presentation-kit/`;
  the index is `templates/bootstrap/src/presentations/{index.ts,registry.ts}` with
  `src/main.tsx`, `src/Landing.tsx`, and `src/routing.ts`. The bootstrap `index.ts` registers the
  template's `starter` presentation: when copying only the index, empty that array (do not copy a
  registry entry whose folder you are not also copying), or copy `src/presentations/starter/` along
  with it. Also copy `scripts/verify.mjs`,
  `scripts/inspect-presentation.mjs`, and `scripts/lib/` and add their npm scripts if absent.

**Confirm before writing in a non-empty project.** If the project is non-empty and lacks the scene
kit or presentation index, tell the user the exact target directory you will scaffold into and
wait for their confirmation before writing anything.

Never assume dependencies are installed. The scaffold must ensure: `react`, `react-dom`, `motion`,
`lucide-react`; and dev dependencies `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
`@types/react-dom`, `@types/node`, the ESLint stack (`eslint`, `@eslint/js`, `typescript-eslint`,
`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`), and `playwright` (render
verification; run `npx playwright install chromium` if no browser is available). The scaffold is
styling-framework-neutral: do **not** add Tailwind or any CSS framework unless the host already
uses it or the user asks, and do not add default colors, fonts, card or button styles, or theme
tokens.

### 3. Generate or modify

**Create** a presentation as its own folder `src/presentations/<slug>/` (under the resolved app
root) from `templates/presentation/` (replace `{{slug}}`, `{{title}}`, and drop the `.tmpl`
suffix): `entities.ts` (the `layoutId` namespace and when each entity first appears), `Scene.tsx`
(entity nodes composed from kit primitives `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
`SymbolChip`; use raw `motion` elements with stable `layoutId`s when coordinates need that),
`steps.ts` (the step list), `Talk.tsx` (renders `<Presentation>`), and `talk.css` (the look).
Register it with one entry in `src/presentations/index.ts`
(`templates/presentation/registry-entry.txt.tmpl`). Leave every existing presentation and registry
entry untouched, so all stay reachable.

**Modify** an existing presentation: if the target is missing or ambiguous, list the registered
presentations and ask which one **before changing anything**. Once identified, ask only about the
requested changes (steps, entities, or style) and edit that presentation in place. Do not re-walk
the full create flow.

### 4. Self-verify before reporting done

Do not report success until all of these pass; when one fails, fix the cause and re-run it.

1. `npm run build` completes with no type errors.
2. `npm run verify` renders every registered presentation through all its steps with no console
   or page errors (at minimum the new presentation's first step must render cleanly).
3. Visual composition: run the project-local screenshot helper
   `npm run inspect -- <slug>` (prefer it to ad hoc scripts; if you must write a temporary
   Playwright script, put it under the project root so it resolves local dependencies). It writes
   settled per-step screenshots to `.inspection/<slug>/`. Look at the first step, the last step,
   and every dense or key step; if the presentation is responsive-sensitive also run
   `npm run inspect -- <slug> --viewport 390x844 --out .inspection/narrow`. Confirm important
   content fits the canvas, intentional overlaps stay readable, and nothing collides with the
   caption, progress dots, table of contents, or navigation controls.
4. Review every advisory warning the helper prints. Fix accidental text/chrome collisions,
   indistinct active-step chrome, and unpolished attribution (style the hooks in the
   presentation's CSS). A `small-text` warning means canvas scaling shrinks scene text below
   a readable size at that viewport (typically the 390×844 pass): enlarge the type in the
   presentation's CSS or simplify the scene, then re-run. Add `data-presentation-allow-overlap` only to subtrees whose overlap is
   intentional and readable. Re-run the helper after fixing.

Finish by reporting the route, the final check results, and any advisory warnings you left on
purpose.

## Quality bar

Every generated presentation builds with no type errors, renders its first step without runtime
errors, shows a caption for each step, supports next/previous navigation, passes the visual
composition check, and follows the evolving-scene model above.

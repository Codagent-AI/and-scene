---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagram, built on a React scene kit. Use when asked to make a presentation, talk, or slide-style explainer from a topic, or to change an existing presentation. Bootstraps the Vite + React + TypeScript app and scene kit when they are missing, then verifies the result builds, renders, and looks right.
---

# Presentation

A presentation is **one scene moving through named steps**, not a deck of separate slides. Entities
keep a stable identity from step to step: persisting ones morph in place, new ones enter after the
others settle, departing ones exit. "Presentation" is the canonical term; "talk" is an informal
synonym (the per-presentation entry file is `Talk.tsx`, and that name is incidental).

## Paths

Resolve every template path **relative to this `SKILL.md`'s directory**, never the current working
directory:

- `templates/bootstrap/` — a complete starter app (build setup, scene kit, presentation index).
- `templates/presentation/` — the files of one presentation (`entities.ts`, `Scene.tsx`, `steps.ts`,
  `Talk.tsx`, `talk.css`).
- `scripts/scaffold.mjs` — detects what is missing and copies only that.

Call the script by its absolute path, for example `node <skill-dir>/scripts/scaffold.mjs detect <project>`.

## Workflow

Choose **create** (new presentation) or **modify** (existing one), then follow its steps. Always end
with *Self-verify*.

### 1. Gather (create)

Ask the user clarifying questions **one at a time**, never as a batch, for:

1. the topic,
2. the visual style (palette, mood, typography — the user owns this),
3. the content and visual description of each step.

Do not assume anything the user can still tell you. If the prompt already contains the topic, style,
and every step, skip the questions and build. The user decides how much to specify: if they choose to
build with partial detail, proceed with what you have and iterate afterwards — there is no
completeness gate. For a step whose layout is key or complex you **may** draw an ASCII mockup and
confirm it first; do not do this for every step.

### 2. Resolve the target and scaffold what is missing

The scaffold has three **contract anchors**. They are detected by what the files provide, not by
file names or byte equality, so cosmetic differences (renamed files, extra dependencies) never
trigger re-scaffolding:

1. **Build setup** — a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit** — the `Step`/`SceneProps` contract, the stage that mounts the active step and runs
   morphs, present/browse navigation, chrome (captions, table of contents), and the fit-scaled canvas.
3. **Presentation index** — the registry that maps each presentation slug to a lazy loader, so
   several presentations coexist, each at its own route.

Run `node <skill-dir>/scripts/scaffold.mjs detect <project-dir>`. It reports the resolved `target`,
which anchors exist there, and `needsConfirmation`:

- an empty directory (only `.git` counts as empty) or a standalone project → scaffold at the root;
- a **monorepo** (`workspaces` in `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/`
  directory) → scaffold a self-contained app in `presentations/`; the monorepo root's own build setup
  does not count as that app's build anchor, and root files are never modified;
- a directory that already is a presentation app → use it as is.

If all three anchors exist, skip scaffolding. If some are missing, scaffold **only the missing
ones**; existing files are never overwritten (the script skips them and merges missing dependencies
and scripts into `package.json`).

**Confirm before writing into a non-empty project.** When `needsConfirmation` is true, tell the user
the target directory and which anchors you will add, and wait for their go-ahead. Only then run
`node <skill-dir>/scripts/scaffold.mjs apply <project-dir> --confirmed --install`. For an empty
directory no confirmation is needed: run `apply <project-dir> --install`.

Do not assume dependencies are installed: `--install` runs `npm install` and installs Playwright's
Chromium. The scaffold needs React, Vite, TypeScript (with React/Node types), Motion, Lucide icons,
the ESLint stack, and Playwright. It is **styling-framework-neutral**: it ships no Tailwind, theme,
colors, fonts, card or button styles. Add a styling framework only if the host project already uses
one or the user asks for it.

### 3. Generate (create)

Copy `templates/presentation/` to `src/presentations/<slug>/` in the target and fill it in:

- `entities.ts` — the presentation's `layoutId` namespace. The same id in two steps means "the same
  thing"; keep ids stable.
- `Scene.tsx` — the scene, composed from kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
  `SymbolChip`). Wrap each entity in `Appear` once, for its whole lifetime, and render entities inside
  `SceneLayer`. Give persisting entities the same id and rect (or a new rect, to morph).
  Coordinate-heavy diagrams may use raw `motion` elements with stable `layoutId`s.
- `steps.ts` — the ordered steps: stable `id`, section/era label, one-line presenter `title`, browse
  `caption` paragraph, and the scene state (`payload`). Adjacent steps that are successive states of the
  same diagram share a `groupKey` and a `Scene`, so the scene persists and only the payload changes.
  Step numbers come from position; never number steps by hand.
- `Talk.tsx` — `<Presentation steps={…} title="…" initialMode="browse" className="…" />`.
- `talk.css` — the look. **Styling belongs to the presentation or the host app, never the kit.** Use
  plain CSS unless the host already uses a styling framework or the user asked for one. Target the
  kit's stable hooks: `[data-presentation-active='true']` (also `aria-current="step"`) on the active
  progress dot and table-of-contents entry, `[data-presentation-attribution]`, `[data-presentation-mode]`,
  `[data-presentation-title]`, `[data-presentation-caption]`, `[data-kind]`-style hooks you add yourself.
  Make the active step visibly distinct and the "made by and-scene" attribution legible (at least 12px,
  not the browser default link color). Do not edit `src/presentation-kit/`.

Then **register** it with one new line in `src/presentations/index.ts`
(`{ slug, title, load: () => import('./<slug>/Talk') }`) and add a matching entry to
`verify.config.json` only if it should become the project's verified reference presentation. Existing
presentations stay untouched and reachable. Mark a subtree that intentionally overlaps (and stays
readable) with `data-presentation-allow-overlap`; use it sparingly and never on a whole scene.

### Modify an existing presentation

Identify the target first. If the request does not name one, or the name is ambiguous, list the
registered presentations (read `src/presentations/index.ts`) and ask which to change **before editing
anything**. Once the target is clear, ask only about the requested change (steps, entities, or style)
and edit that presentation in place. Do not re-walk the create flow, re-scaffold, or touch other
presentations beyond what the change needs.

### 4. Self-verify before reporting done

Do not report success until all of these pass, fixing failures yourself and re-running:

1. **Build** — `npm run build` has no type or build errors.
2. **Render** — at least the first step renders with no runtime or console errors. `npm run verify`
   builds the whole app and steps through every step of the reference presentation; run it for the final
   check.
3. **Visual composition** — run the project-local helper `npm run inspect -- <slug>` (add `--narrow` for
   responsive-sensitive presentations). It writes settled screenshots to `inspection/<slug>/step-NN.png`
   and prints advisory `WARN step N: …` lines. Look at the screenshots, or an equivalent browser view,
   for the **first step, the last step, and every dense or key step**, plus a narrow viewport when the
   presentation is responsive-sensitive. Confirm that important content fits the fixed canvas,
   intentional overlaps are readable, and nothing collides with captions, progress indicators, the table
   of contents, or navigation controls. A silent helper is not enough; the screenshots decide.

   Review every warning: fix accidental text/chrome collisions, indistinct active chrome, and
   unpolished attribution (style `[data-presentation-attribution]`). Mark only genuinely intentional,
   readable overlaps with `data-presentation-allow-overlap`, then re-run the helper. Prefer this helper
   over ad hoc scripts; if you must write a temporary Playwright script, keep it under the project root
   so it resolves the local dependencies.

If a check cannot be made to pass, say so plainly and report what remains; never present broken
output as done.

## The scene kit in one page

| Piece | Purpose |
| --- | --- |
| `Presentation` | Host: `steps`, `title`, `initialMode` (`'present'` or `'browse'`), `brand`, `attribution`, `design`, `className` |
| `Step<Payload>` / `SceneProps<Payload>` | The step contract; typed payloads reach `<Presentation>` without casts |
| Modes | Present: marker + one-line title. Browse: title, caption, table of contents (viewport ≥ 1024px), progress dots, previous/next. `P` toggles, keeping the step |
| Navigation | Right/Space/PageDown next; Left/PageUp back; horizontal swipe; progress dots and table-of-contents entries jump. Clamped at both ends. Focused controls keep their keys |
| Canvas | 880 × 380 by default, scaled uniformly to fit each mode's stage region |
| Hooks | `data-step-count` and `data-step-index` on `[data-presentation-root]`; `data-presentation-*` on chrome and entities |

The kit has **zero styling defaults**: it never supplies colors, fonts, borders, shadows, spacing, or a
CSS framework. Geometry (fixed canvas, chrome placement) is the only thing it sets inline.

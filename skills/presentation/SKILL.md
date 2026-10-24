---
name: presentation
description: Creates or modifies a browser presentation modeled as one evolving diagrammatic scene (stable entities that move, connect and re-label through named steps), scaffolding the React/Vite/Motion app and scene kit when missing and verifying it renders. Use when asked to make, build, create, edit or update a presentation, talk, or slide deck from a topic.
---

# Presentation

Build presentations as **one scene that evolves through named steps**, not as disconnected
slides. Entities keep a stable identity and morph in place between steps; new ones enter after
the others settle; departing ones exit. "Talk" is only an informal synonym for "presentation".

All helper scripts live in `scripts/` next to this file and the templates in `templates/`.
Resolve both **relative to this `SKILL.md`**, never relative to the current directory. In the
commands below, `SKILL` stands for this file's directory.

## 1. Gather requirements (create only)

Ask the user **one question at a time**, never several in one message:

1. the **topic**,
2. the **visual style** (mood, palette, typography, density),
3. the **content and visual description of each step**: a title, a caption, and what appears,
   moves, connects or re-labels.

Rules:

- Do not assume details the user can still provide. Skip a question only when the prompt
  already answers it; if the prompt already contains topic, style and every step, build
  without further questions.
- The user controls depth. If they choose to build after giving only some details, build from
  what you have and iterate afterwards. There is no completeness gate.
- When a step's layout is key or complex, you may draw an ASCII mockup and ask the user to
  confirm it before building. Do this for key steps only, not every step.

## 2. Resolve the target and scaffold what is missing

Run the detector first (it only reads):

```bash
node SKILL/scripts/detect-scaffold.mjs <projectDir>
```

It reports the three **contract anchors** and where the app belongs:

1. **Build setup**: a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit**: `src/presentation-kit/` (the `Step`/`Scene` contract, stage, navigation,
   chrome, fit-scale canvas, node primitives).
3. **Presentation index**: `src/presentations/index.ts`, the registry mapping each
   presentation slug to its own route, plus the router in `src/main.tsx`.

Detection is by contract, not byte equality: cosmetic differences (file names, formatting, extra
dependencies) must not trigger re-scaffolding. Target rules:

- An existing presentation app (kit or index present) is used as is; scaffold only what is missing.
- A **monorepo** (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or
  `apps/` directory) gets a self-contained app in its `presentations/` directory. Never
  mutate the monorepo root.
- An empty or standalone project is scaffolded at its root.

If `needsConfirmation` is true (the project is non-empty and something is missing), **state the
target directory and what will be added, and wait for the user to approve** before writing. Then:

```bash
node SKILL/scripts/scaffold.mjs <projectDir> --confirmed
```

For an empty directory no confirmation is needed. The script only creates missing files, merges
missing dependencies and scripts into an existing `package.json`, never overwrites, installs the
dependencies (React, Vite, TypeScript, Motion, Lucide, ESLint, Playwright; no styling
framework), and exits with code 2 if it needed confirmation it did not get. If all anchors are
present it does nothing. Read its `notes` output: an existing `src/main.tsx` is kept and must be
wired to the registry by hand.

The scaffold is **styling-framework-neutral with zero presentation styling defaults**. Do not add
Tailwind or another framework unless the host project already uses one or the user asks.

A fresh scaffold includes a `getting-started` presentation as a working example; remove its
folder and registry line if the user does not want it.

## 3. Create or modify

### Create

```bash
node SKILL/scripts/new-presentation.mjs <appDir> <slug> "<Title>"
```

This writes `src/presentations/<slug>/` (`entities.ts`, `steps/`, `Talk.tsx`, `talk.css`) and
registers it in `src/presentations/index.ts` at route `/<slug>`. Existing presentations are
left untouched. Then replace the placeholder scene with the real one:

- `entities.ts` is the presentation's `layoutId` namespace. Give each entity one stable id and
  use it in every step where the entity appears.
- Put every step in `steps/index.ts` as a `Step` (stable `id`, `era`, `title` one-liner,
  `caption` paragraph, `Scene`, `payload`). Step numbers derive from array order.
- **Group steps that evolve the same diagram**: give them the same `groupKey` and the same
  `Scene` component. The scene then persists and only its `payload` changes, so entities morph
  in place. Wrap only entities that first appear in a step in `Appear`; never wrap continuing
  ones. Keep intentional overlaps or stacks as designed.
- Compose with the kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`,
  `SceneLayer`), or raw `motion` elements with stable `layoutId`s for coordinate-heavy diagrams.
  The canvas is 880 × 380 design pixels and scales to fit.
- **Style it in the presentation's own plain CSS** (`talk.css`) using the kit's
  `data-presentation-*` hooks. Never add colors, fonts, borders or theme tokens to
  `src/presentation-kit/`; it is style-neutral and must stay byte-aligned with its template.
  Style the active table-of-contents entry and progress indicator
  (`[aria-current='step']`, `[data-presentation-active='true']`) so the current step is visibly
  distinct, and make the bottom-right `[data-presentation-attribution]` link legible.

### Modify

Identify the target first. If the user did not name a clear target, list the existing
presentations (the registry in `src/presentations/index.ts`) and ask which one before changing
anything. Then ask **only** about the requested change (steps, entities or style) and edit that
presentation in place. Do not re-walk the create flow, and do not touch other presentations.

## 4. Self-verify before reporting done

Never report success while a check fails. Fix the problem and re-run.

1. `npm run build`: no type or build errors.
2. `npm run verify`: builds the app and renders every registered presentation through every step
   in a real browser on `127.0.0.1`, failing on any console or page error and naming the step.
   For a quicker loop you may first load just the new route's first step, but finish with the full
   `npm run verify`.
3. Visual composition: `npm run inspect -- <slug>` (also `--viewport 390x844` for a narrow check
   when the presentation is responsive-sensitive). Prefer this project-local helper over ad hoc
   scripts; if you must write a temporary Playwright script, put it under the project root so
   dependencies resolve locally. It waits for transitions to settle, writes
   `.inspection/<slug>/<viewport>/step-NN.png`, and prints advisory warnings. Look at the
   screenshots for the **first step, the last step, and any dense or key steps**. Content must
   fit the canvas, intentional overlaps must stay readable, and nothing may collide with the
   caption, progress indicators, table of contents or navigation controls.
4. Review every warning. Fix accidental text or chrome collisions, indistinct active
   progress/table-of-contents state, and unpolished attribution (via the attribution hook). Mark a
   subtree `data-presentation-allow-overlap` **only** where an overlap is intentional and still
   readable. Re-run the helper and report any remaining advisory warnings honestly.

Do not commit `.inspection/` screenshots or `dist/`.

## Quality bar

Every presentation builds with no type errors, renders its first step without runtime or console
errors, shows a caption per step, supports next/previous navigation, passes the visual
composition check, and follows the evolving-scene model above.

## Kit reference

- `<Presentation steps title initialMode canvas brand attribution />`: `initialMode` is
  `'present'` (title only) or `'browse'` (title, caption, table of contents on wide viewports,
  prev/next, progress). Keys: Right/Space/PageDown next, Left/PageUp back, `P` toggles mode,
  horizontal swipe navigates; navigation clamps at both ends and never steals keys from a
  focused control.
- Root hooks: `data-presentation-root` carries `data-step-count`, `data-step-index`,
  `data-presentation-mode`.
- The kit shows a default bottom-right `made by and-scene` link (`attribution={false}` hides it)
  and no top-left brand; pass `brand` to add your own.

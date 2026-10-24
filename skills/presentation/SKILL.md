---
name: presentation
description: Creates or modifies browser presentations that behave as one evolving diagram, built on a vendored React scene kit. Use when the user asks to make, build, or change a presentation or talk from a topic, or invokes the presentation skill.
---

# Presentation

Generate a browser presentation modeled as **one scene that evolves through named steps**: stable
entities appear, move, connect, and re-label as the explanation develops. It is not a deck of
disconnected slides. "Presentation" is the canonical term; "talk" is a synonym (the entry component
is `Talk.tsx` only by convention).

Everything this skill ships sits next to this `SKILL.md`. Resolve `scripts/` and `templates/`
relative to **this file's directory**, never the current working directory. Below, `$SKILL` means
that directory.

## 1. Gather requirements

Ask the user **one question at a time**, covering:

1. the topic,
2. the visual style,
3. the content and visual description of each step.

The user decides how much to specify. Do not assume details the user can still provide, but let them
build with partial detail ("sketch a few steps and show me") and iterate; there is no completeness
gate. If the prompt already contains topic, style, and every step, skip the questions and build.

For a step whose layout is key or complex, you may draw an ASCII mockup and ask the user to confirm
it before building. Do this selectively, not for every step.

When **modifying** a presentation, do not run the full flow. Identify the target first: if the user
did not name one clearly, list the registered presentations (`src/presentations/index.ts`) and ask
which to change before touching anything. Then ask only about the requested changes (steps,
entities, or style).

## 2. Resolve the target and scaffold what is missing

Before creating or modifying anything, make sure the project has the three **contract anchors**:

| Anchor | Present when |
| --- | --- |
| Build setup | `package.json` with a `build` script and vite, react, typescript; a vite config; `tsconfig.json` |
| Scene kit | `src/presentation-kit/` with the `Step`/`Scene` types and `Presentation` host |
| Presentation index | `src/presentations/index.ts`, the registry mapping each presentation to its route |

Detection is by presence of the anchors, not byte-identical files, so cosmetic differences do not
trigger re-scaffolding. Run:

```bash
node "$SKILL/scripts/scaffold.mjs" plan --cwd <project directory>
```

It prints the resolved `target`, which anchors exist, which are `missing`, and `needsConfirmation`.
Target rules:

- empty or standalone project: the project root;
- monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or `packages/` / `apps/`): a
  self-contained app in `presentations/`, never the monorepo root;
- already inside a presentation app (kit or index present): that app.

If `needsConfirmation` is true (non-empty project missing scaffolding), **tell the user the target
directory and what will be added, and wait for their confirmation before writing.** Then:

```bash
node "$SKILL/scripts/scaffold.mjs" apply --cwd <project directory> --install
```

This copies only the missing anchors from `$SKILL/templates/bootstrap/` (existing files are never
overwritten; an existing `package.json` only gains missing dependencies and scripts) and installs
dependencies and downloads the Chromium that render verification drives (`npx playwright install
chromium`; if that download fails, tell the user and retry before verifying). Do not assume any
dependency or browser is installed. Besides the missing anchors, `apply` always adds the shared
support files it lacks: dependencies, `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, and
the route host (`src/main.tsx`, `src/Router.tsx`, `src/route.ts`, `src/Landing.tsx`). If the project
already has its own `src/main.tsx` it is kept; wire it to `src/Router.tsx` so `/<slug>` routes work. The scaffold is styling-framework-neutral:
React, Vite, TypeScript, Motion, Lucide, ESLint, and Playwright, with no Tailwind, theme, colors, or
fonts. If all three anchors exist, skip scaffolding.

## 3. Create or modify

**Create.** Write a new presentation as its own folder, reachable at its own route and registered:

```bash
node "$SKILL/scripts/scaffold.mjs" create --target <app root> --slug <kebab-slug> --title "<Title>"
```

This writes `src/presentations/<slug>/{entities.ts,scene.tsx,steps.ts,Talk.tsx,style.css}` from
`$SKILL/templates/presentation/` and adds one entry to `src/presentations/index.ts`; existing
presentations are untouched and stay reachable at `/<their-slug>`. Then replace the placeholder
entities, steps, and captions with the user's content.

Follow the scene model:

- One scene. Steps that are successive states of the same diagram share a `groupKey` and `Scene`, so
  the scene instance persists and only `payload` changes.
- Every entity has a stable id in `entities.ts` (its `layoutId`). An entity present in two steps
  morphs in place; do not wrap continuing entities in `Appear`. Wrap newcomers in `Appear` inside an
  `AnimatePresence` so they enter after persisting entities settle and exit when removed.
- Every step has an id, an era label, a one-line presenter title, and a caption paragraph.
- Compose `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, and `SceneLayer` from
  `src/presentation-kit`. Coordinates live on the 880 × 380 design canvas. Use raw `motion`
  elements with stable `layoutId`s when no primitive fits.
- Intentional overlaps and stacking are fine. Mark a subtree that overlaps on purpose with
  `data-presentation-allow-overlap`; mark nothing else.

**Style belongs to the presentation.** Put colors, typography, spacing, borders, shadows, and control
treatments in the presentation's own `style.css` (plain CSS unless the host project already uses a
styling framework or the user asks for one), scoped under the `className` passed to
`<Presentation>`. Never add styling to `src/presentation-kit/`. Style the stable hooks:
`[data-presentation-progress-item]`, `[data-presentation-toc-item]` (make
`[data-presentation-active="true"]` visibly distinct), `[data-presentation-attribution]` (make the
"made by and-scene" link legible), `[data-presentation-title]`, `[data-presentation-caption]`, and
the node hooks `[data-presentation-entity]` / `[data-presentation-node]`.

**Modify.** Edit only the identified presentation (and its registry line if renamed). Keep entity ids
stable so existing morphs survive; change entities, steps, or style as requested.

## 4. Self-verify before reporting done

Never report success while a check fails. Fix the problem and re-run.

1. **Build and render.** `npm run build`, then `npm run verify` (builds, then renders every
   registered presentation step by step in Chromium against a production preview on `127.0.0.1`,
   failing on any console or page error and naming the step). At minimum the first step must render
   with no errors.
2. **Visual composition.** Use the project-local helper, not ad hoc scripts outside the project:
   ```bash
   npm run inspect -- <slug>
   ```
   It writes settled per-step screenshots to `.inspection/<slug>/step-NN.png` (never commit them) and
   prints advisory warnings. Look at the first step, the last step, and every dense or key step; for a
   responsive-sensitive presentation also run it at a narrow viewport (`--viewport 480x800`). Confirm
   important content fits the canvas, intentional overlaps stay readable, and nothing collides with
   chrome (captions, progress indicators, table of contents, controls).
3. **Review warnings.** For each overlap warning, open the referenced step: fix accidental
   collisions, and add `data-presentation-allow-overlap` only to genuinely intentional, readable
   overlaps. For indistinct-active or attribution warnings, style the hooks in the presentation's CSS.
   Re-run the helper until remaining warnings are understood, and report what remains.
4. Report the build, render, and visual-inspection results accurately, including any advisory
   warnings that remain.

If a temporary Playwright helper is ever needed, write it under the project root so it resolves
dependencies locally.

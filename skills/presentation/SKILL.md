---
name: presentation
description: Create or modify a browser presentation that works as one evolving diagrammatic scene (stable entities that appear, move, connect and re-label across named steps). Use when the user asks to make, build, create, edit or change a presentation, talk, or evolving diagram from a topic.
---

# Presentation

A presentation here is **one scene moving through named steps**, not a deck of
slides. Entities keep a stable identity and morph in place from step to step;
new ones enter after the others settle, departing ones exit. "Talk" is only an
informal synonym (the per-presentation entry component is named `Talk.tsx`).

This skill is hybrid: this document is the procedure and quality bar; the
scene kit, templates and scripts keep generated output consistent.

## Paths

Every path below that starts with `templates/` or `scripts/` is **relative to
the directory containing this `SKILL.md`** (call it `$SKILL`), never to your
current working directory. Resolve `$SKILL` from the location of this file
before running anything, for example
`node "$SKILL/scripts/scaffold.mjs" resolve .`.

- `$SKILL/templates/bootstrap/`: the app snapshot used to scaffold a project
  (build setup, scene kit, presentation index, verify and inspect scripts).
- `$SKILL/templates/presentation/`: the starting files of one presentation.
- `$SKILL/scripts/scaffold.mjs`: detection, target resolution, scaffolding and
  registration helper (`resolve`, `bootstrap`, `add`).

## Choose the flow

- The user wants a **new** presentation: follow *Create*.
- The user wants to **change an existing** presentation: follow *Modify*.

Both flows end with *Self-verify*. Never report success before it passes.

## Create

### 1. Gather

Ask the user clarifying questions **one at a time**; never batch them. Cover:

1. the **topic**,
2. the **visual style**,
3. the **content and visual description of each step** (title, caption, what
   appears, moves, connects or changes).

Do not assume details the user can still provide. Skip a question only when the
prompt already answers it; if the prompt already holds the topic, style and all
step details, go straight to building. The user controls the depth: if they
choose to build with only part of the detail captured, build from what you
have, say what you filled in, and iterate afterwards. There is no hard
completeness gate.

For a step whose layout is key or complex you **may** draw an ASCII mockup and
confirm it before building. Do this for the steps that need it, not for every
step.

### 2. Resolve the target and scaffold

Run `node "$SKILL/scripts/scaffold.mjs" resolve <project-dir>`. It reports the
`target`, why, and which of the three **contract anchors** are missing:

1. **Build setup**: a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit**: the presentation-agnostic engine (step/scene contract, stage
   host with entity morphs, present/browse navigation, chrome, fit-scale canvas).
3. **Presentation index**: the registry mapping each presentation to its own
   route, so several presentations coexist.

Detection is contract-level: renamed, reformatted or extended equivalents count,
so do not re-scaffold over cosmetic differences.

Target rules (the script applies them):

- Empty or standalone project: the app lives at the project root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a
  `packages/` or `apps/` layout): a self-contained app in `presentations/`.
  The workspace root's own build setup does not count as the presentation app.
- A directory that already holds the kit or index (the root or `presentations/`)
  is reused; only the missing anchors are added.

**Non-empty project that lacks the scene kit or presentation index:** tell the
user the exact target directory you will scaffold into, and **wait for them to
confirm before writing anything** (no copying, installing or editing before
then). An empty directory needs no confirmation.

Then run `node "$SKILL/scripts/scaffold.mjs" bootstrap <project-dir>`. It copies
only the missing anchors from `$SKILL/templates/bootstrap/`, never overwrites an
existing file, and merges any missing dependencies into an existing
`package.json`. When all three anchors already exist it changes nothing. If an
existing entry point does not render the presentation router, it is replaced
by the router entry point and the old one is kept as `<entry>.bak` (the
`notes` in its output say so). **Never assume the dependencies are installed**: run the
`installCommand` it reports (`npm ci` or `npm install`) in the target before
creating the presentation. The dependency set is React, React DOM, Vite,
`@vitejs/plugin-react`, TypeScript with `@types/react`, `@types/react-dom` and
`@types/node`, Motion, Lucide icons, the ESLint stack, and Playwright (with
`npx playwright install chromium` if Chromium is not available).

The scaffold is **styling-framework-neutral**: it ships no Tailwind, theme,
colors, fonts, card or button styles. Add a styling system only if the host
project already uses one or the user explicitly asks for it.

### 3. Generate

Run `node "$SKILL/scripts/scaffold.mjs" add <app-dir> <slug> "<Title>"`. It
creates `src/presentations/<slug>/` (its own folder) from
`$SKILL/templates/presentation/` and appends one line to
`src/presentations/index.ts`, leaving every existing presentation and route
untouched. It refuses a slug that already exists.

Then replace the template content with the user's story:

- `entities.ts`: the presentation's `layoutId` namespace. One stable id per
  entity, kept for the whole presentation.
- `scene.tsx` and `steps/index.ts`: a `Step<Payload>` per beat with a stable
  `id`, an `era` (section label), a one-line presenter `title`, a browse
  `caption` paragraph, and the diagram state as its payload. Steps that
  continue the same diagram share a `groupKey` and the same `Scene` so the
  scene persists and only the payload changes.
- `Talk.tsx`: `<Presentation steps={STEPS} title=... initialMode=... />`.
- `talk.css`: **all** styling. Plain CSS targeting the kit's
  `data-presentation-*` hooks. The scene kit has zero styling defaults and must
  stay that way: never add colors, fonts, borders or theme tokens to
  `src/presentation-kit/`.

Modeling rules:

- Continuing entities keep their id and morph (position, size, label,
  emphasis); never fade them in. Pass `appear` only to the entities a step
  introduces (kit primitives take it directly; `Appear` wraps raw elements).
  Render entities inside a `SceneLayer` and give each direct child a stable
  `key`, so removed entities can animate out.
- Keep intentional overlaps and stacking as designed. Do not flatten them to
  satisfy a pattern.
- Use kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
  `SymbolChip`) where they fit; use raw `motion` elements with a stable
  `layoutId` for coordinate-heavy shapes.
- Give the presentation local CSS that makes the **active** progress and
  table-of-contents entries (`[data-presentation-active='true']`) clearly
  different from inactive ones, and makes the `[data-presentation-attribution]`
  link legible (intentional size and color, not the browser default).

## Modify

1. **Check the scaffold before editing anything.** Run
   `node "$SKILL/scripts/scaffold.mjs" resolve <project-dir>`. If the scene kit
   or presentation index is missing in a non-empty project, state the exact
   target directory and **wait for the user to confirm before writing
   anything**; then run `bootstrap` (only the missing anchors are added). No
   edit, copy or install happens before that confirmation.
2. Identify the target. If the user did not clearly name a presentation (or the
   name is ambiguous), **list the existing presentations from the presentation
   index (`src/presentations/index.ts`) and ask which to modify before changing
   anything.**
3. Ask only about the requested change (steps, entities or style). Do not
   re-walk the create questions, and leave other presentations alone.
4. Edit that presentation's files in place (keep entity ids stable so morphs
   stay clean).
5. Run *Self-verify*.

## Self-verify

Before reporting success, for a created **or** modified presentation, run all
of these from the app directory and fix every failure yourself, then re-check:

1. `npm run build`: no type or build errors.
2. A render check: at minimum the first step renders with no runtime or
   console errors. `npm run verify` builds the whole app and renders every
   step of every registered presentation in Chromium against a production
   preview on `127.0.0.1`; run it before finishing.
3. A browser **visual composition** check. Run the project-local screenshot
   helper `npm run inspect -- <slug>` (it writes settled screenshots to
   `inspection/<slug>/step-NN.png`, which is gitignored). Look at the first
   step, the last step and every dense or key step; for a responsive-sensitive
   presentation also run it with `-- --viewport 390x844`. Confirm that the
   important content fits the fixed canvas, that intentional overlaps stay
   readable, and that content does not collide with the caption, progress
   indicators, table of contents or navigation controls.
   If the project has no helper, write any temporary Playwright script **under
   the project root** (never outside the project tree) so browser tooling
   resolves from local dependencies.
4. Review every advisory warning the helper prints (`[overlap]`,
   `[active-chrome]`, `[attribution]`), step by step: fix accidental
   collisions, make the current-step chrome visibly distinct, and polish the
   attribution via its styling hook. Add `data-presentation-allow-overlap` only
   to a subtree whose overlap is intentional and readable; never use it to
   silence an accidental collision. Re-run the helper after fixing.

If the build, render check or visual check fails, fix it and re-run. **Do not
report success while anything is failing.** Report the checks you ran and any
remaining advisory warnings accurately.

## Reference

The committed sample, `src/presentations/how-to-make-a-presentation/`, is a
worked example of this skill's output (a presentation about using this skill).
Read it for the entity, step and CSS conventions.

---
name: presentation
description: Create or modify a browser-based presentation modeled as one evolving diagrammatic scene. Use when asked to build a presentation/talk/deck about a topic, or to change an existing one.
---

# Presentation skill

Builds presentations as **one evolving scene**, not a slide deck: stable
entities (boxes, labels, arrows, groups) persist across named steps and morph
in place as the story advances, with present and browse delivery modes. See
`../../openspec/changes/create-and-scene/design.md` and
`../../openspec/changes/create-and-scene/specs/evolving-scene-presentations/spec.md`
for the runtime model this skill's output must satisfy.

All template paths in this document are relative to this file
(`skills/presentation/SKILL.md`), not to the caller's working directory —
resolve them from `__dirname`-equivalent of this file so the procedure works
regardless of where it is invoked from.

## Procedure

1. **Gather** requirements interactively.
2. **Resolve the target and scaffold** whatever infrastructure is missing.
3. **Create or modify** the presentation.
4. **Self-verify** before reporting done.

Do not skip ahead: gather before scaffolding, scaffold before generating,
generate before verifying.

---

## 1. Gather

Ask one question at a time. Do not assume an answer the user can still
provide, and do not present a wall of questions at once.

Cover, in roughly this order:

1. **Create or modify?** If the user's request already names an existing
   presentation or says "change/update/add a step to X", skip to
   [Modify](#modify-an-existing-presentation). Otherwise this is a create flow.
2. **Topic.** What is the presentation about?
3. **Visual style.** What should it look like — palette, mood, tone, any
   reference presentations or brand? (Plain CSS is the default; only reach for
   Tailwind or another framework if the host project already uses one or the
   user asks for it.)
4. **Steps.** For each step: what happens narratively (the beat), and what
   changes on screen (what appears, what moves, what connects). Ask about one
   step at a time rather than demanding the full outline up front.

The user controls how much detail to give:

- If the prompt **already contains** the topic, style, and every step's
  content and visual intent, proceed to build without asking anything.
- If the user chooses to **stop early with partial detail** (e.g. a topic and
  three of nine steps), build from what you have — do not block on a
  completeness gate. Fill unspecified steps with your own reasonable
  narrative continuation of the topic, and say so when reporting completion
  so the user can iterate.
- For a step whose layout is **key or visually complex**, you may draw a
  small ASCII mockup of that step's composition and confirm it with the user
  before building — but do not do this for every step; reserve it for beats
  where getting the layout wrong would be costly to redo.

## 2. Resolve target + scaffold

### Detect the three contract anchors

Check for these at the **contract level** (their presence and shape), not
byte-for-byte — cosmetic differences (file naming, formatting, extra deps)
never trigger re-scaffolding:

| Anchor | Present when |
|---|---|
| **Build setup** | A `package.json` with a working `vite` + `@vitejs/plugin-react` + `typescript` toolchain and an `npm run build` script that runs `tsc` and `vite build`. |
| **Scene kit** | A directory (conventionally `src/presentation-kit/`) exporting the `Step`/`SceneProps` contract, a `Presentation` component composing a `Stage`, navigation, and chrome (header/footer/toc/attribution) with `data-step-count`/`data-step-index` hooks. |
| **Presentation index** | A registry module (conventionally `src/presentations/index.ts`) exporting an array of `{ slug, title, load }` entries, consulted by a router that maps `"/"` to a landing page and `"/<slug>"` to the matching entry. |

If **all three** are present: skip scaffolding entirely, go to step 3.

If **some or none** are present: scaffold only what's missing (see below),
leaving present anchors untouched.

### Resolve the scaffold target

- **Empty directory, or a non-monorepo project with no anchors** → scaffold at
  the repository root.
- **Monorepo** (`package.json` has a `workspaces` field, or a
  `pnpm-workspace.yaml` exists, or the repo root has both a `packages/` and/or
  `apps/` layout alongside other apps) → scaffold a self-contained app under
  `presentations/` instead of touching the monorepo root.
- **Non-empty project that is missing one or more anchors and is neither
  empty nor identified as a monorepo** → state the target location you intend
  to scaffold into (root, or `presentations/`) and wait for the user to
  confirm before writing anything. Do not silently guess in an ambiguous,
  already-populated project.

### Scaffold whatever is missing

Use `templates/bootstrap/` (a complete, working reference app) as the source
for anything missing:

- **Full scaffold** (no anchors present): copy the entire `templates/bootstrap/`
  tree to the target directory, then run its dependency install (see below).
- **Partial scaffold** (some anchors present): copy only the missing pieces
  from `templates/bootstrap/` — e.g. if the build setup and scene kit exist
  but there is no presentation index, add just `src/presentations/index.ts`,
  `src/router.ts`, `src/AppRouter.tsx`, and `src/Landing.tsx`, wiring them into
  the existing `src/main.tsx` instead of overwriting it wholesale.

Never assume the required dependencies already exist. Ensure the full set —
adding whichever are missing — after copying files:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Dev/build: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`, the ESLint stack (`eslint`, `@eslint/js`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
  `typescript-eslint`, `globals`), and `playwright` (for the render check).

Do **not** add Tailwind, a Tailwind Vite plugin, or any other styling
framework unless the host project already depends on one or the user
explicitly asks for it. `templates/bootstrap/` never references one.

The bootstrap template's `src/presentation-kit/` is a style-neutral snapshot:
it has no palette, font, spacing, border, shadow, card, button, or theme
defaults, and no styling-framework dependency. Copy it as-is; presentation
visual design always lives in the presentation's own files (or the host
app's), never in the kit.

## 3. Generate or modify

### Create a new presentation

1. Pick a URL-safe `slug` from the topic (kebab-case).
2. Create `src/presentations/<slug>/` containing:
   - `entities.ts` — from `templates/presentation/entities.ts.template`; one
     constant per stable entity that needs to morph across steps.
   - `steps/StepN.tsx` — one per gathered step, from
     `templates/presentation/steps/Step.tsx.template`, composing kit
     primitives (`src/presentation-kit/nodes/*`) and giving each persisting
     entity the matching `layoutId` from `entities.ts`. Steps whose scene is a
     direct continuation of the previous one's diagram (rather than a fresh
     composition) may share a `groupKey` and a single `Scene` component with a
     typed `payload`, so the instance persists across the transition instead
     of remounting — see the "Persistent grouped scenes" requirement in
     `evolving-scene-presentations/spec.md`.
   - `steps/index.ts` — from `templates/presentation/steps/index.ts.template`,
     listing every step in on-screen order.
   - `Talk.tsx` — from `templates/presentation/Talk.tsx.template`, rendering
     `<Presentation steps={STEPS} title="…" initialMode="…" />`.
   - `presentation.css` (or `.module.css` if the host already uses CSS
     Modules) — from `templates/presentation/presentation.css.template`,
     imported by `Talk.tsx`. This is where the gathered visual style is
     realized: colors, type, spacing, borders, and the active/attribution
     treatments the kit leaves undefined.
3. Register it by **adding one entry** to `src/presentations/index.ts`:
   `{ slug, title, load: () => import('./<slug>/Talk') }`. Do not touch any
   other registry entry — existing presentations must remain intact and
   reachable.

### Modify an existing presentation

1. If the target presentation isn't already clear from the request, list the
   registered presentations (from `src/presentations/index.ts`) and ask which
   one to change before touching anything.
2. Once identified, ask **only** about the requested change (a step's
   content/visual, a new step, an entity, or the style) — do not re-run the
   full gather flow.
3. Scope every edit to that presentation's folder:
   - Adding a step: create `steps/StepN.tsx` from
     `templates/step/Step.tsx.template`, add it to `steps/index.ts` at the
     right position, and add any new entity to `entities.ts`.
   - Changing a step's content/visual: edit that step's file in place.
   - Changing the look: edit the presentation's own CSS, not the shared kit.
4. Leave every other presentation and the shared kit untouched.

## 4. Self-verify

Before reporting completion:

1. Run the build (`npm run build`). Any type or build error must be fixed,
   not reported as a success.
2. Run at least a first-step render check — open the presentation's route and
   confirm it renders without console or runtime errors. Prefer the project's
   `npm run verify` (`scripts/verify.mjs`) when available, since it steps
   through every step of every registered presentation on `127.0.0.1` and
   fails on any console error, page error, or stalled step transition; a
   lighter single-route check is acceptable mid-iteration but the full
   `npm run verify` (or equivalent) must pass before reporting done.
3. Visually inspect the result in a browser: the first step, the last step,
   and any dense/key steps at minimum; also check a narrow viewport if the
   presentation is responsive-sensitive. Prefer the project-local screenshot
   helper (`npm run inspect -- <slug>`, from `scripts/inspect-presentation.mjs`)
   over an ad hoc script outside the project tree, so browser tooling
   resolves from local dependencies and screenshots are captured after
   transition animations settle.
4. Review any advisory warnings the screenshot helper prints (overlap,
   indistinct active chrome, unpolished attribution). Fix accidental
   collisions and indistinct active/attribution styling. If an overlap is
   intentional composition (not a bug), mark that subtree with
   `data-presentation-allow-overlap="true"` instead of treating the warning as
   something to silently ignore.
5. Only report completion once build, render check, and visual inspection all
   pass (or all remaining warnings are confirmed intentional).

If any check fails, fix the presentation (or, if the gap is in the kit or
templates themselves, fix that) and re-run the checks — never report success
on a known failure.

## Templates

- `templates/bootstrap/` — a complete, working app (build setup + scene kit +
  router + empty presentation index) used to scaffold missing infrastructure.
  Its `src/presentation-kit/` must stay behaviorally aligned with the canonical
  kit this repository ships under `src/presentation-kit/`.
- `templates/presentation/` — skeleton for a brand-new presentation:
  `entities.ts.template`, `Talk.tsx.template`, `presentation.css.template`,
  `steps/Step.tsx.template`, `steps/index.ts.template`.
- `templates/step/Step.tsx.template` — skeleton for a single new step, used
  when modifying an existing presentation.

Template files use `{{PLACEHOLDER}}` tokens; replace every placeholder with
gathered content before writing the file, and remove any template comments
that no longer apply.

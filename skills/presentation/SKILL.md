---
name: presentation
description: >
  Creates and modifies evolving-scene browser presentations: one shared
  diagrammatic canvas whose entities morph across named steps, with captions,
  navigation, and present/browse modes. Use when the user asks to "create a
  presentation", "build a talk", "add steps", "modify a presentation", or
  needs presentation infrastructure scaffolded (fresh project or monorepo).
  Gathers topic/style/step details one question at a time, self-bootstraps
  missing scaffolding, generates or edits a presentation, registers it at its
  own route, and self-verifies build + render + visual composition before
  reporting done.
---

# Presentation skill

Build **evolving-scene presentations**: stable entities on one fixed canvas
morph as the viewer moves through named steps, instead of a deck of unrelated
slides. Each presentation is a self-contained folder under
`src/presentations/<slug>/` composing the reusable, style-neutral
**scene kit** at `src/presentation-kit/`.

## When to use

- Create, build, or generate a presentation or talk
- Modify, update, or add/remove steps on an existing presentation
- The project has no scene kit or presentation registry yet and needs bootstrapping

## Procedure

Work through these phases in order. Do not skip self-verify.

### 1. Gather requirements

Ask **one question at a time**:

1. **Topic** — what the presentation is about
2. **Visual style** — accents, mood, density
3. **Per-step content and visual intent** — for each step: what it says
   (title/caption) and what appears on the canvas (entities, what morphs from
   the previous step)

Rules:

- Do not assume details the user can still provide.
- Allow the user to proceed with **partial detail** — no hard completeness
  gate. Build from what was captured and note open follow-ups when reporting
  completion.
- If the prompt already states topic, style, and every step, skip straight to
  scaffolding/generation without further questions.
- For a key or visually complex step, optionally sketch an ASCII mockup and
  confirm it before building. Use mockups selectively, not for every step.

### 2. Resolve target + scaffold if needed

Detect three **contract anchors** at the contract level (presence, not
byte-identical files — cosmetic differences don't trigger re-scaffolding):

| Anchor | Look for |
|---|---|
| Build setup | `vite.config.ts` and a `package.json` with a working `build` script |
| Scene kit | `src/presentation-kit/types.ts`, `Presentation.tsx`, `Stage.tsx` |
| Presentation index | `src/presentations/index.ts` exporting a `presentations` registry |

**Target resolution:**

| Context | Scaffold location |
|---|---|
| Empty directory, or an existing standalone (non-monorepo) JS app | Repository root |
| Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/`/`apps/` layout) | Self-contained app under `presentations/` |
| All three anchors already present | Use it as-is; scaffold only what's missing |

**Non-empty project missing anchors:** state the resolved target (e.g. "I'll
scaffold into `presentations/`") and proceed only after the user confirms.

**Scaffolding steps** (skip entirely if all anchors are present):

1. Copy whatever anchors are missing from `templates/bootstrap/` **in this
   skill's own directory** — resolve that path relative to this `SKILL.md`
   file, never relative to the caller's working directory.
2. Never assume dependencies exist. Ensure the full set: runtime `react`,
   `react-dom`, `motion`, `lucide-react`; dev/build `vite`,
   `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
   `@types/node`, the eslint stack, and `playwright` (render checks). Do
   **not** add Tailwind or another styling framework unless the host already
   uses one or the user explicitly asks for it — the bootstrap ships zero
   presentation styling defaults on purpose.
3. Run `npm install` in the resolved target directory. If scaffolding into a
   monorepo subdirectory, rename the copied `package.json`'s `name` field to
   suit the host (the template ships a neutral `presentation-app`).
4. If Chromium isn't available for Playwright, run
   `npx playwright install chromium` in the target directory.

### 3. Generate or modify

#### Create a new presentation

1. Derive a kebab-case **slug** from the title.
2. Create `src/presentations/<slug>/` using `templates/presentation/` as a
   starting point (adapt content — these are illustrative skeletons, not
   copy-verbatim boilerplate):
   - `entities.ts` — the stable `layoutId` namespace, one entry per
     conceptual entity (not per step)
   - `steps/*.tsx` — one file per step (see `templates/presentation/steps/`
     for a plain step and a grouped-scene step), assembled into a `STEPS`
     array
   - `<slug>.css` — presentation-owned styling; plain CSS by default (see
     `templates/presentation/style.css`) unless the host already uses a
     framework or the user asked for one
   - `Talk.tsx` — renders `<Presentation steps={STEPS} title="…" />`
3. Register it in `src/presentations/index.ts`, preserving every existing
   entry:

   ```ts
   { slug: '<slug>', title: '<Title>', load: () => import('./<slug>/Talk') },
   ```

#### Modify an existing presentation

1. If the target presentation isn't clearly named, list the entries in
   `src/presentations/index.ts` and ask which one before changing anything.
2. Once identified, ask only about the requested change (steps, entities,
   style) — do not re-run the full gather flow.
3. Make scoped edits to that presentation's `entities.ts`, `steps/*`, or
   `Talk.tsx`. Leave every other presentation untouched.

### 4. Self-verify

Before reporting success:

1. **Build** — `npm run build` in the app directory; must complete with no
   type errors.
2. **Render check** — at minimum, the first step must render without
   runtime/console errors. Prefer `npm run verify` (from
   `templates/bootstrap/scripts/verify.mjs`) when it's present in the target;
   it builds, serves a production preview on `127.0.0.1`, and steps through
   every registered presentation using the `data-step-count`/`data-step-index`
   hooks. Otherwise start `npm run preview` and open the route yourself.
3. **Visual composition check** — inspect the first step, the last step, and
   any dense/key step at a normal desktop viewport; also check a narrow
   viewport for responsive-sensitive presentations. Prefer
   `npm run inspect -- <slug>` (from
   `templates/bootstrap/scripts/inspect-presentation.mjs`) over an ad hoc
   script outside the project tree, so Playwright resolves from local
   dependencies and screenshots land under the project-local
   `presentation-inspection/<slug>/`. It waits for transitions to settle,
   then prints advisory warnings for unmarked text/chrome overlap, an
   indistinct active progress/TOC state, and unpolished attribution.
4. Review every warning: fix accidental collisions and indistinct/unpolished
   chrome; mark only genuinely intentional overlaps by wrapping that subtree
   in an element with a `data-allow-overlap` attribute.
5. If any check fails, fix the issue and re-run it — never report success on
   broken output.

## Output format

Report completion as:

1. **Action** — created or modified, presentation title, and route (`/<slug>`)
2. **Files changed** — paths written or edited
3. **Verification** — commands run and their result (build, render check,
   visual composition check + any warnings resolved)
4. **Follow-ups** — open questions or partial details the user may want to
   iterate on later (omit if none)

## Composing the scene kit

Read `src/presentation-kit/types.ts` and one existing presentation (if any)
before writing steps, to match the current step contract exactly.

**Step contract** (`src/presentation-kit/types.ts`):

```ts
interface Step<TPayload = unknown> {
  id: string        // stable identity across the whole presentation
  era: string        // table-of-contents section label
  title: string      // present-mode one-liner
  caption: string    // browse-mode paragraph
  groupKey?: string  // steps sharing this (and Scene) persist; only payload changes
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}
```

**Entity continuity:** any node that should morph across steps carries the
same `layoutId`, sourced from that presentation's `entities.ts`. A new
conceptual entity gets a new id.

**Grouped scenes:** consecutive steps that are states of one evolving diagram
should share a `groupKey` and `Scene` component, with only `payload`
differing — see `templates/presentation/steps/grouped-step.tsx`. Do not split
one evolving picture into unrelated `Scene`s just to add a step.

**Node primitives** (`src/presentation-kit`, all unstyled — `className`/`style`
only, no defaults):

| Primitive | Purpose |
|---|---|
| `Box` | Bordered-card entity; optional `Icon` (Lucide component) |
| `Label` | Text annotation |
| `Arrow` | Connector; `rotate` prop for direction |
| `Frame` | Grouping/reveal frame |
| `Emphasis` | Emphasis-state marker (`active` prop drives styling) |
| `SymbolChip` | Icon+label chip |
| `Appear` | Fade-in wrapper for newcomers only (never wrap persisting entities) |
| `SceneLayer` | Absolutely-positioned diagram layer so one step never reflows another |

Every primitive stamps `data-presentation-node="<name>"`. Chrome exposes
`data-presentation-*` hooks (`caption`, `progress-dot` with
`data-active`, `toc-entry` with `data-active`, `attribution`, …) — target
these from presentation CSS. The kit provides motion, layout, and hooks only;
color, type, spacing, borders, and shadows are the presentation's job.

**Smooth-morph rules:**

- Put a stable `layoutId` only on the entity that should morph; give a new
  visual object a new id.
- Do not add `scale`/`rotate`/`opacity` styling directly to an element that
  also carries `layoutId` — Motion drives those during layout projection. If
  a child needs those effects, put them on a non-`layoutId` wrapper.
- Avoid mixing `position: relative` and `position: absolute` on one element;
  keep absolute placement on a wrapper that isn't the shared layout entity.
- Preserve intentional overlaps when fixing a morph bug — move only the
  unsafe styling to a wrapper, don't redesign the composition.
- Let layout re-center: use content-sized, centered flex/grid composition so
  each step's layout naturally re-aligns around what's currently on screen.
  Avoid fixed pixel widths, reserved empty slots, or `flex-start` pinning —
  they freeze position and kill the re-centering that makes morphs read as
  intentional.
- On wide browse viewports the table of contents occupies the left edge, and
  captions/progress/nav occupy the bottom band — keep dense rows to at most
  ~3 primary boxes, or wrap/stack as a scene grows.
- Mark a genuinely intentional overlap by wrapping that subtree in an element
  carrying `data-allow-overlap`, rather than treating every overlap as a bug.

## Out of scope

This skill does **not**:

- Export to PowerPoint, Keynote, PDF, or images
- Build a visual editor, or host/publish a presentation
- Process or convert existing slide-deck files
- Build unrelated React features outside the presentation system

## Quality bar

Every generated or modified presentation must:

- Build with `npm run build` — no type errors
- Render its first step without runtime or console errors
- Show a caption per step (browse mode) and support next/previous navigation
- Conform to the evolving-scene model (stable entities morph; new entities
  enter after persisting ones settle; departing entities exit)
- Pass the visual composition check (fits the fixed canvas, no accidental
  chrome collisions, intentional overlaps stay readable)
- Make the active progress dot / TOC entry visibly distinct and the
  `made by and-scene` attribution legible, via presentation-owned CSS

## Templates

| Path | Purpose |
|---|---|
| `templates/bootstrap/` | Full app snapshot for scaffolding a fresh/empty project or monorepo subdirectory |
| `templates/bootstrap/scripts/verify.mjs` | Build + multi-step render verifier for the scaffolded app |
| `templates/bootstrap/scripts/inspect-presentation.mjs` | Project-local screenshot + advisory-warning helper |
| `templates/presentation/` | Skeleton for a new presentation folder (`entities.ts`, `steps/`, `style.css`, `Talk.tsx`) |
| `templates/presentation/steps/step.tsx` | Single non-grouped step skeleton |
| `templates/presentation/steps/grouped-step.tsx` | Typed-payload grouped-scene step skeleton |

Replace `{{PLACEHOLDER}}` tokens in templates with gathered content; they are
skeletons to adapt, not files to copy byte-for-byte.

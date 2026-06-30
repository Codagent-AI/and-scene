---
name: presentation
description: >
  Creates and modifies evolving-scene browser presentations. Use when the user
  asks to "create a presentation", "build a talk", "add steps", "modify a
  presentation", or scaffold presentation infrastructure. Gathers requirements
  interactively, bootstraps missing scaffolding (monorepo-aware), registers
  presentations at their own routes, and self-verifies build + render before
  reporting done.
---

# Presentation skill

Build **evolving-scene presentations**: one shared diagrammatic canvas where
entities morph across steps while captions and navigation guide the audience.
Each presentation is a self-contained folder under `src/presentations/<slug>/`
that composes the reusable **scene kit** at `src/presentation-kit/`.

## When to use

- User asks to create, build, or generate a presentation or talk
- User asks to modify, update, or add steps to an existing presentation
- Project lacks the scene kit or presentation infrastructure and needs bootstrapping

## Procedure

Work through these phases in order. Do not skip self-verify.

### 1. Gather requirements

Ask **one question at a time**. Cover:

1. **Topic** — what the presentation is about
2. **Visual style** — accents, mood, density (sparse diagram vs. rich layout)
3. **Each step** — content (title, caption, era) and visual description (which
   entities appear, how they relate, what morphs between steps)

Rules:

- Do **not** assume details the user can still provide
- Allow the user to proceed with **partial detail** and iterate later — no hard
  completeness gate
- If the prompt already contains topic, style, and all step details, proceed to
  scaffold/generate without further questions
- For **key or complex steps**, optionally draw an **ASCII mockup** of the layout
  and ask the user to confirm before building. Use mockups selectively, not for
  every step

### 2. Resolve target + scaffold if needed

Before creating or modifying a presentation, ensure three **contract anchors**
exist. Detection is **contract-level** (presence of the anchor, not byte-identical
files). Cosmetic differences do not trigger re-scaffolding.

| Anchor | What to look for |
|--------|------------------|
| **Build setup** | `vite.config.ts`, `package.json` with a `build` script |
| **Scene kit** | `src/presentation-kit/types.ts`, `Presentation.tsx`, `Stage.tsx` |
| **Presentation index** | `src/presentations/index.ts` exporting a `presentations` registry |

**Target resolution:**

| Context | Scaffold location |
|---------|-------------------|
| Empty directory, or an existing standalone JS app (a `package.json` at the root, non-monorepo) | Repository root (`.`) |
| Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or `packages/` / `apps/` layout) | Self-contained app under `presentations/` |
| Non-empty repo that is **not** a JS app (no root `package.json` — e.g. a Python/Go/Rust project) | Self-contained app under `presentation/` |
| Anchors already present | Use existing app; scaffold only missing anchors |

**Monorepo detection signals:** `package.json` `workspaces`, `pnpm-workspace.yaml`,
or files under `packages/` or `apps/`.

**Why non-JS repos nest:** the bootstrap is a full Vite + React app. Dropping its
`package.json`, `vite.config.ts`, and `src/` at the root of a Python/Go/Rust repo
would collide with the existing project, so the scaffold lands in a dedicated
`presentation/` subfolder instead. Only a truly empty directory or a repo that is
already a JS app gets scaffolded in place at the root.

**Scaffolding steps:**

1. Determine which anchors are missing (all, some, or none)
2. Copy missing pieces from `templates/bootstrap/` in this skill directory.
   The bootstrap `package.json` ships a neutral `presentation-app` name —
   rename it to suit the target project (e.g. the repo or monorepo package
   name) before installing.
3. **Install dependencies** — never assume they are present. The scaffold must
   ensure this full set:
   - **Runtime:** `react`, `react-dom`, `motion`, `lucide-react`
   - **Dev/build:** `vite`, `@vitejs/plugin-react`, `typescript`,
     `@types/react`, `@types/react-dom`, `@types/node`, `tailwindcss`,
     `@tailwindcss/vite`, the eslint stack (`@eslint/js`, `eslint`,
     `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`,
     `typescript-eslint`), and `playwright` (for render checks)
4. Run `npm install` in the resolved target directory

**Non-empty project without scaffolding:** state the resolved target location
(e.g. "I will scaffold into `presentations/`") and proceed only after the user
confirms.

**Already scaffolded:** skip scaffolding and go directly to generate/modify.

Utility helpers in `scaffold.ts` (alongside this file) implement anchor
detection, monorepo heuristics, and target resolution for automated checks.

### 3. Generate or modify

#### Create a new presentation

1. Derive a **slug** from the title (kebab-case, e.g. `how-to-use-this-skill`)
2. Create `src/presentations/<slug>/` from `templates/presentation/`:
   - `entities.ts` — stable `layoutId` namespace for every morphing entity
   - `steps/*.tsx` — one file per step; each exports a `Step` object
   - `Talk.tsx` — imports all steps, renders `<Presentation steps={STEPS} />`
3. Register in `src/presentations/index.ts`:

```ts
{
  slug: '<slug>',
  title: '<Human title>',
  load: () => import('./<slug>/Talk'),
},
```

4. Preserve all existing registry entries — new presentations must not break others

#### Modify an existing presentation

1. **Identify the target** from the user's request
2. If unspecified or ambiguous, **lists the existing presentations** from
   `src/presentations/index.ts` and asks which to modify
3. Ask only about the **requested changes** (steps, entities, style) — do not
   re-walk the full create flow
4. Make scoped edits to that presentation's `entities.ts`, `steps/*`, or `Talk.tsx`

### 4. Self-verify

Before reporting success:

1. Run `npm run build` in the presentation app directory — must complete with no
   type errors
2. Run a **render check** on the presentation route — at minimum, the first step
   must render without runtime or console errors. Use `npm run verify` when
   available (full multi-step check), or start `npm run preview` and open the
   route in a browser / Playwright
3. If either check fails, **fix the issues and re-check** — never report success
   on broken output

### Output format

Report completion in this structure:

1. **Action** — created or modified, with presentation title and route (`/<slug>`)
2. **Files changed** — list of paths written or edited
3. **Verification** — commands run (`npm run build`, render check) and their result
4. **Follow-ups** — any unresolved questions or partial details the user may want to iterate on (omit if none)

## Composing the scene kit

Presentations import from `src/presentation-kit/`. Each presentation supplies
only its own entities and step scenes.

### Step contract

```ts
interface Step {
  id: string          // stable key for AnimatePresence
  era: string         // table-of-contents section label
  title: string      // presenter-mode one-liner
  caption: string    // browse-mode paragraph
  groupKey?: string  // consecutive steps with same groupKey are not remounted
  payload?: Record<string, unknown>
  Scene: ComponentType<{ step: Step }>
}
```

### Entity continuity (`layoutId`)

Define stable ids in `entities.ts`. Any node that should **morph** across steps
must use the same `layoutId`:

```ts
export const ENTITIES = { hero: 'hero', flow: 'flow' } as const
```

### Node primitives

Compose steps from kit primitives (all accept `layoutId`):

| Primitive | Use for |
|-----------|---------|
| `Box` | Bordered card with optional Lucide icon, label, subtitle |
| `Label` | Small uppercase annotation |
| `Arrow` | Directional connector (default `→`) |
| `Frame` | Grouped region with optional frame label |
| `Emphasis` | Highlighted callout |
| `SymbolChip` | Icon-as-symbol or compact chip variant |
| `Appear` | Fade-in for newcomers after persisting entities settle |
| `SceneLayer` | Absolutely-positioned diagram layer (prevents reflow between steps) |

### Layout pattern

```tsx
import { Box, SceneLayer, Arrow } from '../../presentation-kit'
import { ENTITIES } from '../entities'

function MyScene() {
  return (
    <SceneLayer>
      <div className="flex items-center gap-8">
        <Box layoutId={ENTITIES.hero} label="Idea" accent="cyan" />
        <Arrow layoutId={ENTITIES.flow} />
        <Box layoutId={ENTITIES.result} label="Outcome" accent="green" />
      </div>
    </SceneLayer>
  )
}
```

Position entities with Tailwind flex/grid/absolute classes inside `SceneLayer`.
The kit scales a fixed design canvas (880×380) to fit between header and footer.

### Adding a step

Copy `templates/single-step/step.tsx` into `steps/`, customize metadata and
layout, then append to the `STEPS` array in `Talk.tsx`.

### Navigation and chrome

The kit provides browse/present modes, captions per step, table of contents,
progress dots, and prev/next controls. Users navigate with →/Space/PageDown (next),
←/PageUp (prev), P (toggle mode), or horizontal swipe.

## Out of scope

This skill does **not**:

- Design or export non-browser slide decks (PowerPoint, Keynote, PDF, images)
- Process or convert existing slide-deck files
- Create unrelated React apps or generic frontend features outside presentations
- Handle image generation, hosting, or publishing

Redirect those requests to the appropriate skill or tool.

## Quality bar

Every generated presentation must:

- Build with `npm run build` — no type errors
- Render its first step without runtime or console errors
- Show a caption per step (browse mode) and support next/previous navigation
- Conform to the evolving-scene model (stable entities morph across steps)

## Templates

| Path | Purpose |
|------|---------|
| `templates/bootstrap/` | Full app snapshot for bootstrapping fresh/empty projects |
| `templates/presentation/` | New presentation folder (`entities.ts`, `steps/`, `Talk.tsx`) |
| `templates/single-step/step.tsx` | Template for adding one step |

Replace `{{PLACEHOLDER}}` tokens in templates with gathered content.

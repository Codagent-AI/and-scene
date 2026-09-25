## Context

And Scene is a Vite + React 19 + TypeScript fixture for an Agent Runner eval. The
change adds a local **presentation skill** that generates browser-based
presentations modeled as one evolving diagrammatic scene (stable entities moving
through named steps), plus the reusable engine those presentations run on, a
verification flow, and a committed self-referential sample.

The runtime model and most of the visual approach are proven in the sibling repo
`codagent-dot-dev` (`src/presentation/harness/**`): a fixed design canvas scaled
to fit, `motion` layout (`layoutId`) morphs for entity continuity, an
`AnimatePresence` step host, a keyboard/touch nav hook, and present/browse chrome.
That code is **talk-specific** (nodes like `LLMNode`, `ToolsNode`); this design
generalizes the engine into a reusable kit and keeps each presentation's entities
local to itself.

Current scaffold state: plain-CSS single-page `App.tsx`, no router, no Tailwind.
`react`, `react-dom`, `motion`, and `lucide-react` are already in
`package.json`. Specs in `openspec/changes/create-and-scene/specs/`:
`presentation-skill`, `evolving-scene-presentations`, `presentation-verification`
(`eval-fixture-branching` was descoped).

## Goals / Non-Goals

**Goals:**
- A reusable, presentation-agnostic **scene kit** (engine + generic node
  primitives) that any generated presentation imports.
- A **skill** that interactively gathers details, self-bootstraps missing
  scaffolding (monorepo-aware), generates/modifies presentations, registers them,
  and self-verifies build + render.
- A committed **sample** ("How to Use This Skill to Make a Presentation").
- A **verification** entry point (`npm run verify`) that builds the whole app and
  renders the sample through every step in a real browser.
- Behavioral parity with the `codagent-dot-dev` harness where it already solved a
  problem (canvas dimensions, morph timing, navigation, and modes), while keeping
  all visual styling owned by the presentation or host.

**Non-Goals:**
- Export (PPT/Keynote/PDF/image), a visual editor, hosting/publishing.
- Eval fixture branching (descoped — one-time manual op after this ships).
- The Agent Runner Docker/smoke-test config (external dependency, tracked
  separately).

## Approach

### Repository layout

```
src/
  main.tsx                 # minimal pathname router: "/" → Landing, "/<slug>" → lazy presentation
  Landing.tsx              # replaces App.tsx; enumerates the registry, links to each presentation
  index.css                # host/app CSS only; no reusable-kit visual defaults
  presentation-kit/        # the reusable engine (the "scene kit") — canonical source
    types.ts               # Step, Scene, StepMeta, SceneProps  (the step contract)
    constants.ts           # EASE, LAYOUT_T, ENTER_T/ENTER_DELAY, DESIGN_W=880, DESIGN_H=380,
                           #   MIN_SCALE, STAGE_LAYOUT { browse, present }
    usePresentationNav.ts  # keyboard (→/Space/PageDown, ←/PageUp, P) + touch swipe + mode; clamp at ends
    useFitScale.ts         # uniform fit scaling for the active mode's stage geometry
    Stage.tsx              # LayoutGroup + AnimatePresence host for the active step's Scene
    Presentation.tsx       # composes Stage + chrome + nav from steps[] + { initialMode, title }
    chrome/
      Header.tsx           # logo/marker row; title in browse mode
      Footer.tsx           # caption (browse) / title (present), progress dots, prev/next
      Toc.tsx              # era-based table of contents (browse, wide viewports)
    nodes/                 # generic primitives composed by each presentation's steps
      Box.tsx              # bordered card; optional LucideIcon glyph; carries layoutId
      Label.tsx, Arrow.tsx, Frame.tsx, Emphasis.tsx
      SymbolChip.tsx       # generalized HarnessNode with stable styling hooks
      Appear.tsx, SceneLayer.tsx
  presentations/
    index.ts               # EXPLICIT registry: [{ slug, title, load: () => import('./<dir>/Talk') }]
    how-to-make-a-presentation/        # the committed sample
      entities.ts          # this presentation's layoutId namespace (stable entity ids)
      steps/*.tsx          # 9 Step objects composing kit primitives
      Talk.tsx             # <Presentation steps={STEPS} title=… initialMode="browse" />
skills/presentation/
  SKILL.md                 # procedure (below)
  templates/               # app + kit + step/presentation templates (used only to bootstrap a fresh project)
scripts/
  verify.mjs               # build + Playwright render-check; invoked by `npm run verify`
```

### Scene kit (the engine)

A direct generalization of `codagent-dot-dev/src/presentation/harness/**`:

- **Step contract** (`types.ts`): generic `Step<TPayload>` and
  `SceneProps<TPayload>` types preserve strongly typed grouped payloads through
  the `<Presentation>` boundary without casts. Steps that
  share a `groupKey` (and `Scene`) are not remounted between navigations — the
  instance persists and only `payload` changes, so on-screen entities update in
  place; otherwise `AnimatePresence` cross-fades and shared `layoutId` elements
  morph.
- **Stage**: fixed design canvas (`DESIGN_W=880 × DESIGN_H=380`) wrapped in
  `LayoutGroup` + `AnimatePresence`, scaled by `useFitScale` to the gap between
  header and footer. Scale is constant within a mode so `layoutId` morphs stay
  clean; switching modes is a re-render, not a morph.
- **Nav** (`usePresentationNav`): `→/Space/PageDown` next, `←/PageUp` prev, `P`
  toggles mode, horizontal swipe = next/prev; `next`/`prev` clamp at `[0, last]`;
  keys do not hijack focused controls.
- **Chrome**: present mode shows marker + one-line title (caption, ToC, nav
  hidden); browse mode shows title + multi-line caption + ToC (wide viewports) +
  progress dots + prev/next. A presentation may declare `initialMode`.
  Active navigation exposes semantic current state and stable active hooks.
  Bottom-right attribution defaults to a `made by and-scene` GitHub link with a
  stable hook; top-left branding is host opt-in.
- **Generic node primitives**: the reusable replacement for dot-dev's
  talk-specific nodes. Each accepts stable identity and class/data/style hooks,
  but supplies no palette, font, spacing, border, shadow, card, button, or theme
  defaults. `Appear` sequences newcomers only after persisting entities settle;
  `SceneLayer` absolutely positions a step's diagram so mounting one layer never
  reflows another.

Each **presentation** supplies only its own `entities.ts` (its `layoutId`
namespace) and `steps/*` (Scenes composing the primitives), then renders
`<Presentation steps=… />`. This is what keeps generated output consistent enough
for evals.

### Routing + registry

- `main.tsx` reads `window.location.pathname`: `"/"` → `Landing`; `"/<slug>"` →
  the matching registry entry, `React.lazy`-loaded inside `<Suspense>`; unknown →
  `Landing` (or a simple not-found).
- `presentations/index.ts` is an **explicit** array of
  `{ slug, title, load: () => import('./<dir>/Talk') }`. Adding a presentation =
  new folder + one registry line. Chosen over `import.meta.glob` so registration
  is deterministic and diffable in evals.
- `Landing.tsx` enumerates the registry (replaces the placeholder `App.tsx`).

### Skill (`skills/presentation/SKILL.md`)

Hybrid: the SKILL.md drives the agent procedure; `templates/` and the kit keep
output consistent. Procedure:

1. **Gather** — ask one question at a time for topic, visual style, and each
   step's content + visual description; optionally draw ASCII mockups for key or
   complex steps. The human controls depth and may build with partial detail.
2. **Resolve target + scaffold if needed** — detect the three contract anchors
   (build setup, scene kit, presentation index). Resolve a target location
   (below), then scaffold whatever is missing using `templates/`, installing the
   full dependency set. In a non-empty project, state the target and confirm
   first.
3. **Generate / modify** — write `entities.ts` + `steps/*` (create) or make
   scoped edits to an identified presentation (modify); register new
   presentations in `index.ts`.
4. **Self-verify** — run the build and the render check; fix failures before
   reporting done.

**Scaffold target resolution:**
- Empty dir / standalone project → scaffold at root.
- **Monorepo** detected (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or
  a `packages/`|`apps/` layout) → scaffold a self-contained app under
  `presentations/` rather than mutating the monorepo root.
- Already inside a presentation app (anchors present) → use it; scaffold only
  missing anchors.

**Required dependency set the scaffold ensures** (cannot assume any are present):
- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Dev/build: `vite`, `@vitejs/plugin-react`, `typescript` + `@types/react` +
  `@types/react-dom` + `@types/node`, the eslint stack, and `playwright` (for the
  render check). Tailwind or another framework is added only when the host already
  uses it or the user explicitly requests it.

### Verification (`npm run verify` → `scripts/verify.mjs`)

1. `npm run build` (`tsc -b && vite build`) over the whole app — any type/build
   error fails.
2. Assert the canonical nine-step sample is present in `presentations/index.ts`
   with every normative title and caption in order.
3. `vite preview` on `127.0.0.1`, then Playwright (Chromium) opens the sample
   route using the same IPv4 loopback address. The driver
   reads the step count from a `data-step-count` hook on the chrome, then steps
   through every step (`ArrowRight`), checking the `data-step-index` advances.
4. Any `console.error`, `pageerror` (uncaught exception), or failed step
   transition fails verification and reports the failing step index.
5. Process exits non-zero on any failure (machine-readable for evals).

The chrome exposes `data-step-count` and `data-step-index` test hooks so the
headless driver enumerates steps without coupling to DOM structure.

The project-local screenshot helper captures every settled step and reports
advisory warnings for unmarked visible text/chrome overlap, indistinct active
navigation, and missing, browser-default, or undersized attribution. Intentional
overlap is exempt only through an explicit allow-overlap marker.

### Styling

The reusable scene kit owns behavior, layout geometry, and stable DOM hooks only.
It has zero visual defaults and no styling-framework dependency. Each
presentation owns its designed look in presentation-local plain CSS unless the
host already uses, or the user explicitly requests, another styling system.

## Decisions

1. **Style-neutral kit + presentation-owned CSS** — only behavioral and geometric
   decisions are ported from the reference. Stable hooks let each presentation
   own palette, typography, spacing, borders, shadows, and control treatments.
   This prevents the reusable engine from becoming an accidental design system.
2. **Generic node primitives** — ship `Box/Label/Arrow/Frame/Emphasis/SymbolChip`
   parameterized by stable identity and semantic styling hooks instead of
   talk-specific nodes. This is the core generalization that makes the kit
   reusable across topics. *Alternative:* copy the reference nodes (couples the
   kit to one talk and its visual system).
3. **Zero-dep pathname router + explicit registry** — minimal `main.tsx` switch +
   `presentations/index.ts`. Deterministic, diffable, no new dep. *Alternatives:*
   `react-router-dom` (extra dep/surface); `import.meta.glob` auto-registration
   (non-deterministic for evals).
4. **Render check = Playwright over `vite preview`** — real browser stepping the
   sample, failing on console/page errors; faithful to `motion` layout and
   aligned with the Agent Runner Docker smoke test. *Alternative:* Vitest + jsdom
   per-step mount (fast, no browser, but can't faithfully run layout animation —
   weaker signal).
5. **Skill carries a template snapshot; canonical kit lives in `src/`** — the
   app/sample use `src/presentation-kit/` naturally; the skill's `templates/` is a
   snapshot used only to bootstrap a fresh/empty project. Keeps the fixture's
   layout natural for the implementing agent. *Alternative:* a Vite alias so the
   app consumes the kit from the skill's templates (no duplication, but an
   unusual layout that reads worse as a fixture).
6. **Scaffold target resolution + full dependency set** — scaffolding resolves
   root vs. a `presentations/` subdir (monorepo) and ensures the complete
   dependency set rather than assuming any deps exist. *Alternative:* always
   scaffold at root (breaks monorepo use).
7. **`glyphs = lucide-react`** — already a dependency here; the scaffold adds it
   for fresh projects. Same icon-as-component pattern as the reference (`Icon:
   LucideIcon`), so adding art is one import, no SVG authoring.

## Risks / Trade-offs

- **Template ↔ `src/presentation-kit` drift** → Treat `templates/` as a release
  snapshot of the kit; verification builds and renders the materialized app, so
  any drift that breaks rendering fails CI. Keep the snapshot in sync when the
  kit changes.
- **Playwright browser in Docker/CI** → Install Chromium in the verify step; this
  matches the Agent Runner smoke environment the proposal already assumes. Heavier
  than a jsdom check, accepted for fidelity.
- **Monorepo detection is heuristic** → The skill states the resolved target and
  confirms before writing in any non-empty project, so a wrong guess is caught by
  the user, not silently applied.
- **StrictMode double-invoke + `motion`** → The reference runs fine under
  `StrictMode`; keep it. Watch for effect/animation double-fire during
  implementation.
- **Self-verify cost inside the skill** → A full Playwright pass on every skill
  run is slow; the skill may run the lighter build + a single-route render first
  and reserve the full `npm run verify` for completion, as long as it does not
  report success on broken output.

## Migration Plan

Greenfield (no production users); the implementing change will, roughly:
1. Add `playwright` for verification (runtime/build dependencies already present);
   keep the reusable kit styling-framework-neutral.
2. Build `src/presentation-kit/**` by generalizing the reference harness.
3. Add the router (`main.tsx`), `Landing.tsx` (replacing `App.tsx`), and
   `presentations/index.ts`.
4. Implement the sample under `presentations/how-to-make-a-presentation/`
   and register it.
5. Add `scripts/verify.mjs` and the `verify` npm script.
6. Author `skills/presentation/SKILL.md` + `templates/`.
7. Run `npm run verify` to confirm build + render.

Rollback is trivial (revert the branch); no data or external state.

## Open Questions

- Skill name defaults to `presentation` (`skills/presentation/`); rename is
  trivial if a different convention is preferred.
- Exact monorepo-detection signal set (package.json `workspaces` vs.
  `pnpm-workspace.yaml` vs. `packages/`/`apps/`) — finalize during
  implementation; behavior (scaffold into `presentations/`) is fixed.

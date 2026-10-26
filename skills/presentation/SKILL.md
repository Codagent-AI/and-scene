---
name: presentation
description: Creates or modifies browser-based presentations as evolving diagrammatic scenes. Trigger when users ask to create a presentation, build a slide deck, modify presentation steps, scaffold an And Scene app, or verify presentation rendering.
---

# And Scene presentations

Create or modify browser-based presentations as one evolving diagram, not a
stack of independent slides: persistent entities retain
their stable identity across ordered scene states and new entities enter only
when the story introduces them.

## Resolve the request

First determine whether the request is to create a presentation or modify one.
If modifying and no presentation is named unambiguously, inspect the explicit
registry at `src/presentations/index.ts`, list the candidates, and ask which
presentation to change. Do not edit anything until the target is clear.

For a new presentation, gather information one question at a time. Do not fill
in details the user can still provide.

1. Ask for the topic if it is absent.
2. Ask for the visual direction if it is absent (mood, audience, colors/type if
   known, and any visual references).
3. Ask for each narrative beat in order: its present title, browse caption, and
   what appears, persists, moves, or exits in the diagram.
4. For a visually dense or pivotal beat, offer a small ASCII layout to confirm
   the composition. Do not make this a ritual for simple beats.

The user may explicitly proceed with partial detail at any point. Record the
provided constraints, mark unresolved choices as intentional, and build from
that material rather than imposing a completeness gate. If the initial request
already supplies the topic, visual direction, and every beat, proceed directly.

For a scoped modification, ask only about the requested changes to the selected
presentation's steps, entities, or style; do not repeat the new-presentation
interview.

## Find or bootstrap the app

Resolve template paths from this skill's own directory, never from the caller's
working directory:

```text
<directory containing this SKILL.md>/templates/bootstrap/
<directory containing this SKILL.md>/templates/presentation/
```

Inspect three contract anchors rather than looking for byte-identical files:

1. a Vite + React + TypeScript build with a working `npm run build`,
2. `src/presentation-kit/` with the typed step contract, stage/morph host,
   present/browse navigation and chrome, and fixed-canvas fit scaling, and
3. `src/presentations/index.ts` with a route registry that supports multiple
   presentations.

When all anchors exist, reuse them. When only some exist, copy only the missing
anchor(s), their supporting files, and missing dependencies; preserve the host's
existing build setup and presentations.

For no anchors, select the target as follows:

- In an empty directory or standalone project, scaffold at its root.
- Detect a monorepo from `workspaces` in `package.json`, `pnpm-workspace.yaml`,
  or an `apps/` or `packages/` layout. Scaffold a self-contained app at
  `presentations/`, never at the monorepo root.
- In a non-empty, unscaffolded or partially scaffolded project, state the exact
  target path and ask for confirmation before writing. This confirmation is
  required even when the target heuristic is clear.

Copy `templates/bootstrap/` for a full scaffold. It includes the build files,
router, landing page, presentation index, complete style-neutral scene kit, and
project-local `scripts/verify.mjs` and `scripts/inspect-presentation.mjs`.
The `.template-files` manifest inside its kit identifies the canonical kit files
that must remain byte-aligned with `src/presentation-kit/` in this repository.

Install the complete declared dependency set; never assume it is present:

- Runtime: `react`, `react-dom`, `motion`, and `lucide-react`.
- Tooling: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`, ESLint and its configured plugins, and
  `playwright` for render checks.

Do not add Tailwind, a Tailwind plugin, or another styling framework unless the
host already uses it or the user explicitly requests it. The kit must not gain
colors, fonts, spacing scales, borders, shadows, card/button treatments, or CSS
theme tokens. Its data/class hooks are deliberately the boundary at which the
presentation or host owns all visual decisions.

## Create a presentation

Use `templates/presentation/` as the starting shape:

```text
src/presentations/<slug>/
  entities.ts
  Talk.tsx
  presentation.css
  steps/
```

Give every entity a stable, presentation-local `layoutId` namespace in
`entities.ts`. Define every beat as a typed `Step<TPayload>` with a stable `id`,
`era`, present `title`, browse `caption`, `Scene`, and `payload`. Consecutive
states of one diagram share a `groupKey` and Scene component so the scene stays
mounted while payload changes; use `Appear` only for genuinely new entities.
Compose the generic kit primitives (`Box`, `Label`, `Arrow`, `Frame`,
`Emphasis`, `SymbolChip`, and `SceneLayer`) or raw motion elements with stable
layout IDs when a primitive is unsuitable.

Put every visual choice in the presentation's `presentation.css` (plain CSS is
the default) or host CSS: palette, typography, placement, borders, shadows,
control state, progress/table-of-contents state, and the attribution hook. Make
the caption and next/previous controls usable on every step. Do not put
presentation styling into `src/presentation-kit/`.

Create a self-contained folder and add one explicit registry entry in
`src/presentations/index.ts`:

```ts
{ slug: '<slug>', title: '<title>', load: () => import('./<slug>/Talk') },
```

Do not replace existing registry entries or presentation files. A new route is
`/<slug>`. For a modification, edit only the selected presentation plus any
strictly necessary shared verification/registration artifact.

## Verify before completion

Never report success before all applicable checks are clean. Run these from the
scaffolded app root:

```bash
npm run build
npm run verify -- <slug>
npm run inspect -- <slug>
```

`verify` builds, starts a production preview on `127.0.0.1`, renders the route
in Playwright, and steps through the public `data-step-count` and
`data-step-index` hooks. It is the minimum render check and must include a
clean first step. Fix build, console, page, route, or transition failures and
rerun it; a failure is never a successful completion.

The project-local inspection helper saves settled per-step screenshots under
`artifacts/presentation-inspection/<slug>/` and prints advisory warnings for
chrome overlap, indistinct active navigation, and unpolished attribution.
Review every warning. Fix accidental collisions and weak chrome treatment;
mark only genuinely intentional, readable overlap with
`data-presentation-allow-overlap`. Inspect the first, last, and densest/key
beats visually. For a responsive-sensitive composition, repeat at a narrow
viewport. When available, use `chrome-devtools-axi` for interactive inspection:

```bash
chrome-devtools-axi open http://127.0.0.1:<port>/<slug>
chrome-devtools-axi snapshot
chrome-devtools-axi screenshot /tmp/<slug>.png
```

Use this exact completion report after all required checks pass:

```text
Presentation route: /<slug>
Changed files: <one path per line or concise grouped list>
Verification:
- npm run build — <pass/fail>
- npm run verify -- <slug> — <pass/fail>
- npm run inspect -- <slug> — <pass/fail and warning disposition>
Visual inspection: <first/last/dense steps and viewport sizes inspected>
Retained visual caveats: <none, or only explicitly intentional readable overlap>
```

Do not describe the work as complete while a required build, render, or
visual-composition problem remains.

## Out of Scope

Do not use this skill for conventional independent-slide decks, PowerPoint,
Keynote, PDF, or image export, visual-editor work, or unrelated image/video
generation. Use the appropriate document, export, or image-generation workflow
for those requests instead. This skill owns browser-rendered, routed React
presentations built as evolving scenes.

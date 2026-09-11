---
name: presentation
description: Create or modify a browser-based presentation that advances one evolving diagrammatic scene through named steps.
---

# And Scene presentation skill

Use this procedure when a user asks to create or modify a presentation. A
presentation is one diagrammatic scene that evolves through named steps; it is
not a collection of unrelated slides. The reusable scene kit owns behavior and
layout plumbing, while the presentation or host owns every visual decision.

## 1. Gather requirements, one question at a time

First determine whether the request creates a new presentation or modifies an
existing one.

For a new presentation, ask only the next missing question, in this order:

1. What is the topic and desired route slug?
2. What visual direction should it have (mood, palette, typography, density,
   and constraints)?
3. What is the next story beat? Capture its era, one-line presenter title,
   browse caption, and visual intent: which entities appear, persist, move,
   connect, or disappear.

Repeat the third question until the user says the outline is complete. Do not
invent details the user can still provide. Explicitly offer to build from the
details gathered so far; partial detail is valid and must not be blocked by a
hard completeness gate. If a key or complex layout would benefit from
confirmation, show one small ASCII mockup for that step only.

If the prompt already contains the topic, style, and all step details, proceed
without asking redundant questions.

For a modification, inspect the existing presentation registry first. If the
target is missing or ambiguous, list the registered presentations and ask which
one to modify. After the target is identified, ask only about the requested
step, entity, or style changes; do not repeat the full create interview.

## 2. Resolve the target and contract anchors

Locate this `SKILL.md` and resolve every template path relative to its directory:

```text
<skill-directory>/templates/bootstrap/
<skill-directory>/templates/presentation/
<skill-directory>/templates/step.tsx
```

Never resolve those paths from the agent's current working directory.

Before creating or modifying a presentation, inspect the target for these
contract anchors. Presence of the contract is what matters, not filenames,
formatting, or byte identity:

- Build setup: `package.json` has a `build` script and the project has Vite,
  React, and TypeScript configuration.
- Scene kit: a `src/presentation-kit/` (or equivalent) exposing the
  `Step`/`Scene` contract, active scene host, present/browse navigation and
  chrome, and fixed-canvas fit scaling.
- Presentation index: a registry in `src/presentations/index.ts` (or the host's
  equivalent) mapping each presentation to an independently loadable route.

Resolve the scaffold destination before writing:

- An empty directory or standalone JavaScript app is scaffolded at its root.
- A monorepo (package.json `workspaces`, `pnpm-workspace.yaml`, or an
  `apps/`/`packages/` layout) gets a self-contained app under
  `<repository>/presentations/`.
- If all anchors are present, use the existing app and scaffold nothing.
- If only some anchors are present, add only the missing pieces and preserve
  the anchors that already satisfy the contract.

For a non-empty project that lacks required scaffolding, state the resolved
target location and obtain confirmation before writing there. Do not overwrite
existing presentations or unrelated host files.

For a full scaffold, copy `templates/bootstrap/` to the resolved target,
renaming the neutral package name if appropriate, then run `npm install` in the
target. Do not assume dependencies are already installed. The bootstrap
declares this complete dependency set:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`
- Build/types: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`
- Lint: `@eslint/js`, `eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`
- Browser verification: `playwright`

Do not add Tailwind or another styling framework unless the host already uses
it or the user explicitly requests it. The vendored kit and bootstrap are
style-neutral: they do not define a palette, font, spacing scale, color,
border, shadow, card/button treatment, theme token, or CSS framework.

## 3. Create or modify a self-contained presentation

For a new presentation, derive a kebab-case slug and copy
`templates/presentation/` into:

```text
src/presentations/<slug>/
  entities.ts
  Talk.tsx
  presentation.css
  steps/
```

Use `templates/step.tsx` (or the equivalent single-step template) for each
additional step. Every step must have a stable `id`, `era`, presenter `title`,
browse `caption`, `Scene`, and typed `payload`. Give persistent entities stable,
presentation-namespaced `layoutId` values. Adjacent states of the same diagram
should use the same `groupKey` and scene component so their payload updates in
place; use `Appear` only for newcomers after continuing entities settle.

Put all coordinates and visual treatment in presentation-owned CSS or host CSS.
Use the generic `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`,
`Appear`, and `SceneLayer` primitives, or raw motion elements with stable
layout IDs when a custom shape is needed. Preserve intentional composition and
mark only readable intentional overlaps with `data-presentation-allow-overlap`.

Register the new route with one explicit entry in the presentation index and
preserve all existing entries. A new presentation must remain independently
reachable at `/<slug>`.

For a modification, edit only the identified presentation's entities, steps,
scene, or local style, plus the necessary registry/verification entry. Keep
other presentations intact and reachable.

## 4. Verify, inspect, repair

Run commands from the generated app root:

```bash
npm run build
npm run verify -- <presentation-slug>
npm run inspect -- <presentation-slug>
```

If the app has no full verifier yet, use the bootstrap verifier or run a local
Playwright first-step render check against `vite preview` on `127.0.0.1`. Prefer
the project-local `scripts/inspect-presentation.mjs`; it captures screenshots
after transitions settle and emits advisory diagnostics for text/chrome
overlaps, indistinct active navigation, and missing, browser-default, or
undersized attribution. Temporary helpers belong under the project root.

Perform a visual composition check by inspecting the first step, last step, and dense/key steps. Also inspect a narrow
viewport when the composition is responsive-sensitive. Review every warning:
fix accidental collisions and weak active or attribution styling, and use an
explicit overlap marker only for a deliberate readable overlap. If build,
render, or visual inspection fails, fix the issue and rerun the failed check;
never report success while a required check is broken.

## Completion report

Report the action and route, files changed, verification commands and results,
the inspected steps/viewports, and any remaining advisory warning or partial
detail. A generated presentation is complete only when it builds cleanly,
renders its first step without runtime or console errors, has captions and
navigation for every step, and satisfies the evolving-scene and local-style
ownership contracts.

## Templates and scripts

| Path | Purpose |
| --- | --- |
| `templates/bootstrap/` | Full Vite/React/TypeScript app and style-neutral kit snapshot |
| `templates/presentation/` | New presentation folder with entities, scene, styles, and one step |
| `templates/step.tsx` | Additional typed step/scene template |
| `scripts/verify.mjs` | Local build and production-browser smoke verification |
| `scripts/inspect-presentation.mjs` | Settled per-step screenshots and advisory visual diagnostics |

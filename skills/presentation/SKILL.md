---
name: presentation
description: Create or modify browser-based React presentations as evolving diagrammatic scenes. Use when a user wants a new presentation, talk, or visual explanation built in a repository.
---

# Presentation

Build a presentation as one evolving scene: stable entities retain their IDs as
steps change their position, content, emphasis, and connections. A presentation
is a routeable, self-contained folder registered in `src/presentations/index.ts`.

## Gather only what is missing

Ask one question at a time. First establish whether the request is to create or
modify, then gather only the missing topic, visual direction, and each step's
content and visual intent. Do not invent details the user can provide. For a
complex or decisive layout, an ASCII sketch is useful; do not make it a ritual
for ordinary steps.

The user may explicitly proceed with partial detail. Record what was decided,
make restrained decisions for the remaining details, and leave the presentation
easy to refine. If a complete request already supplies topic, style, and steps,
build without redundant questions.

For a modification, identify the target first. If it is absent or ambiguous,
list the registered presentations and ask which one to change. Then ask only
about the requested step, entity, or visual adjustment; do not restart the
create interview.

## Find or bootstrap the app

Treat these as contract anchors, not byte-for-byte files:

1. A Vite + React + TypeScript build with a working `npm run build`.
2. `src/presentation-kit/`, containing the typed `Step`/`Scene` contract, stage,
   navigation, chrome, and fit-scale canvas.
3. `src/presentations/index.ts`, an explicit route registry.

If all anchors exist, preserve them and work in the existing app. If an anchor is
missing, add only the missing infrastructure and its dependencies. Never replace
an already working build setup or existing presentations.

Resolve templates from the directory containing this file, not from the caller's
working directory:

```text
SKILL_DIR/ = directory containing SKILL.md
bootstrap = SKILL_DIR/templates/bootstrap/
presentation = SKILL_DIR/templates/presentation/
step = SKILL_DIR/templates/step/
```

Choose the scaffold target before copying files:

- Empty or standalone project: the project root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or `apps/` or
  `packages/`): a self-contained `presentations/` app.
- Non-empty project without all anchors: state the resolved target and wait for
  explicit confirmation before writing. Do not mutate unrelated root files.

For a full scaffold, copy `templates/bootstrap/`, install its declared
dependencies, and use its package scripts. Ensure the runtime dependencies are
`react`, `react-dom`, `motion`, and `lucide-react`; ensure the build dependencies
cover Vite, its React plugin, TypeScript and React/Node types, ESLint, and
Playwright. Do not add Tailwind or another styling system unless the host already
uses one or the user requests it.

The snapshot under `templates/bootstrap/src/presentation-kit/` is deliberately
style-neutral. Keep it byte-aligned with the canonical kit's non-test sources.
Do not add kit-owned palette, typeface, spacing scale, border, shadow, card,
button, or theme defaults. Generated presentations use local plain CSS by
default, and style active table-of-contents/progress state and attribution there.

## Create or modify presentation files

For a new presentation, make `src/presentations/<slug>/` from the presentation
template, give it a local `entities.ts`, steps, and presentation-owned CSS, and
add exactly one explicit registry entry:

```ts
{ slug: '<slug>', title: '<title>', load: () => import('./<slug>/Talk') }
```

Use the kit primitives rather than modifying the kit for a presentation's
design. Give every step a concise caption, title, era, and typed payload. Reuse
stable entity IDs from `entities.ts` across adjacent states so one scene visibly
evolves. Provide useful next/previous navigation through `<Presentation>`.

When adding a presentation, leave every existing folder and registry entry
intact. For a scoped modification, edit only the selected presentation plus a
necessary registry or host file.

## Verify and inspect before success

Do not report completion until all applicable checks pass. Fix failures and run
the failed check again.

1. Run `npm run build` from the target app.
2. Run `npm run verify -- <slug>` when available. Until a multi-step verifier is
   available, start the local preview on `127.0.0.1`, open `/<slug>` in a real
   browser, and confirm its first step has no console or runtime errors.
3. Prefer `npm run inspect -- <slug>` for settled project-local screenshots.
   Inspect the first, last, and densest or key step. Also inspect a narrow
   viewport when the composition is responsive-sensitive.
4. Review reported overlap, active-state, and attribution warnings. Fix
   accidental collisions, indistinct active chrome, and illegible attribution.
   Mark only a genuinely intentional and readable overlap with an explicit
   allow-overlap marker.

In the completion report, name the route, changed presentation, build/render
checks, visual views inspected, and any intentional advisory warning left in
place.

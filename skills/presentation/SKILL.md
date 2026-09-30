---
name: presentation
description: Creates or modifies browser-based presentations as evolving diagrammatic scenes. Triggers when users ask to create a presentation, build a deck, modify slides, edit presentation steps, or change presentation visuals.
---

# Presentation

Use this skill to create or modify a browser-based presentation. A presentation
is one evolving scene, not a collection of disconnected slides: stable entities
keep their identity while named steps add, transform, and emphasize them.

## Locate the templates

Resolve every template path relative to this SKILL.md directory, never from
the current working directory:

```text
<this skill directory>/templates/bootstrap/
<this skill directory>/templates/presentation/
```

The bootstrap snapshot is deliberately self-contained. Do not import it from an
arbitrary checkout or assume a package is already installed.

## Gather the brief

First determine whether the request is to create or modify a presentation.

For a new presentation, ask **one question at a time** for any detail that was
not supplied:

1. What is the topic and intended audience?
2. What visual style should it have (mood, palette, type treatment, and level
   of formality)?
3. For each step: what is its title, browse caption, and visual intent? Ask
   about the next step only after recording the current one.

Do not invent information the author can still provide. The author may choose
to continue from **partial detail** at any point; record what is known, flag the
assumptions in the completion report, and make the smallest coherent scene from
it. If the prompt already gives topic, style, and all steps, begin implementation
without repeating questions. For a key or complex composition, an optional
small ASCII mockup can confirm layout before implementation; do not make a
mockup mandatory for every step.

For a modification:

1. Identify the target presentation. If it is unclear, list the registrations
   from `src/presentations/index.ts` and ask which one to change.
2. Before editing, read the target's `Talk.tsx`, `entities.ts`, all files under
   `steps/`, presentation CSS, and registry entry. Read one neighboring
   presentation when one exists. Record its import layout, entity naming,
   scene-grouping, and styling patterns, and match those patterns in the edit.
3. Ask only about the requested steps, entities, or style. Preserve the rest of
   that presentation and all other routes.

## Resolve the target and anchors

Inspect the intended project for these contract anchors, not byte-for-byte file
matches:

1. a Vite + React + TypeScript build with a working `npm run build`;
2. a presentation-agnostic scene kit with the typed `Step`/`Scene` contract,
   staged active scene, present/browse navigation and chrome, and fit canvas;
3. a presentation registry that maps multiple presentation routes to loaders.

Classify the target before writing:

- An empty directory or standalone project uses its repository root.
- A monorepo is detected by `workspaces` in `package.json`,
  `pnpm-workspace.yaml`, or `packages/` / `apps/`. Its self-contained app goes
  in `presentations/`, not in the monorepo root.
- If all anchors already exist, use that app and do not scaffold it again.
- If only some anchors exist, fill only the missing anchors and required
  dependencies; leave working anchors intact.

In a non-empty project that lacks one or more anchors, state the resolved target
location and proceed only after the author confirms it. Do not silently mutate a
non-empty unscaffolded repository.

## Bootstrap when needed

Copy only the necessary content from `templates/bootstrap/` into the resolved
app directory. A full bootstrap includes the Vite app, `src/presentation-kit/`,
the explicit registry and pathname router, plus local `scripts/verify.mjs` and
`scripts/inspect-presentation.mjs` helpers. The kit snapshot is behavior and
geometry only: it must stay free of palette, typography, spacing, borders,
shadows, card/button treatments, CSS theme tokens, Tailwind, and any other
design-system defaults.

Ensure the complete dependency set is installed rather than assuming it exists:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build and verification: `vite`, `@vitejs/plugin-react`, `typescript`,
  `@types/react`, `@types/react-dom`, `@types/node`, ESLint and its React/
  TypeScript stack, and `playwright`.

Do not add Tailwind or another styling framework unless the host already uses
one or the author explicitly requested it. Use presentation-local plain CSS by
default.

## Create a presentation

Create a self-contained folder under `src/presentations/<slug>/` using the
presentation templates:

- `entities.ts` owns stable namespaced layout IDs.
- `steps/` contains typed `Step` objects, beginning with the supplied
  `steps/first.tsx` template. Group consecutive steps that share a `Scene` and
  `groupKey` so their entities update in place.
- `Talk.tsx` composes `<Presentation>` and imports only local visual CSS.
- `presentation.css` owns all colors, fonts, spacing, controls, active chrome,
  and attribution treatment. Never put presentation design in the reusable kit.

Give every step an era, title, caption, visual intent, and stable entity
continuity. Add exactly one explicit registry entry in `src/presentations/index.ts`
with its slug, title, and lazy loader. Preserve existing registrations and their
routes. The generated route must work as `/<slug>`.

## Verify and inspect before completion

Do not report success until all checks are clean. Run these from the resolved
app root, fixing failures and rerunning the affected checks:

1. `npm run build`.
2. `npm run verify -- <slug>` when the verifier accepts a target route. The
   bootstrap verifier may omit the slug only when exactly one presentation is
   registered. Otherwise use the local Playwright helper under the project root
   to open `http://127.0.0.1:<port>/<slug>` and confirm the first step has no
   console or runtime errors.
3. Prefer `npm run inspect -- <slug>` when the project-local screenshot helper
   exists. It captures settled screenshots after each transition and exposes
   advisory overlap, active-chrome, and attribution warnings.
4. Inspect the first, last, and dense/key steps in a browser. For a
   responsive-sensitive presentation, inspect a narrow viewport too.

Review every visual warning: fix accidental collisions, clipped canvas content,
or indistinct active controls; add an explicit `data-presentation-allow-overlap`
marker only to intentional, readable overlap. Make locally styled progress,
table-of-contents, navigation, and attribution clearly legible. A completed
presentation must build, render its first step without errors, contain captions,
support previous/next navigation, and remain a coherent evolving scene.

## Completion report

Use this exact structure; check statuses are `pass`, `fail`, or `not run`:

```markdown
Route: /<slug>

Files:
- <created or modified path>

Checks:
- build: <pass|fail|not run> — <command or reason>
- render: <pass|fail|not run> — <command or reason>
- inspection: <pass|fail|not run> — <command or reason>

Visual inspection:
- <viewport and inspected first, last, dense, or key steps>

Assumptions:
- None.

Remaining failures:
- None.
```

Replace `None.` with concise items when assumptions or failures remain. Do not
claim success if any required build, render, or composition check is `fail` or
`not run`.

## Out of scope

- Native PowerPoint or Keynote files: use a workflow that authors those native
  formats or export from a compatible presentation tool.
- PDF-only decks or document-layout requests: use document or PDF generation
  tooling instead of this browser-presentation skill.
- Unrelated websites, dashboards, or general web applications: use the host
  project's normal web-development workflow unless the request is specifically
  for an evolving-scene presentation route.

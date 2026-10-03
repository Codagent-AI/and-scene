---
name: presentation
description: Creates and modifies evolving-scene browser presentations. Use when the user asks to "create a presentation", "build a talk", "add steps", "modify a presentation", or "scaffold presentation infrastructure". Gathers requirements interactively, bootstraps missing scaffolding (monorepo-aware), registers presentations at their own routes, and self-verifies build + render + visual composition before reporting done.
---

# Presentation

Generates and modifies presentations built on the **and-scene** model: one
evolving diagrammatic scene (stable entities that morph across named steps)
rather than a slide deck. Read this whole procedure before acting; do not
invent extra ceremony beyond what it describes, and do not skip steps.

**Scope:** this skill produces browser-based evolving-scene presentations —
React/TypeScript apps rendered in a browser, not slide documents. It does not
create or edit native PowerPoint/Keynote/Google Slides files, PDFs, or images.
If the user specifically wants one of those deliverables, say so and redirect
them to the appropriate document-editing tool instead of building an
evolving-scene presentation.

## Procedure

### 1. Determine create vs. modify

Before anything else, decide whether the request is to create a new
presentation or modify an existing one:

- Clearly a **create** request (new topic, no existing presentation named or
  implied) → go to [Gather](#2-gather).
- Clearly a **modify** request (names or clearly implies an existing
  presentation, or asks to change/add/remove steps in one) → skip Gather
  entirely and go straight to the **Modify** flow in
  [Generate or modify](#5-generate-or-modify): identify the target, then ask
  only about the requested change.
- Ambiguous → ask the user directly which they mean before proceeding.

The full Gather phase (topic, style, every step's content and visual
description) applies to **creation only**. Do not re-run it for a
modification — that duplicates work the presentation already encodes and
asks the user questions the request already answered.

### 2. Gather

Ask the user one question at a time, in this order, unless the incoming
prompt already answers it:

1. **Topic** — what is this presentation about?
2. **Visual style** — what should it look like (palette, tone, density)?
3. **Per-step content and visual description** — what does each step say and
   show?

Rules:

- Never assume a detail the user could still supply. If the prompt is
  missing the topic, the style, or any step's content/visual description,
  ask for it — one question at a time, not a bundled checklist.
- The user controls how much detail to give. At any point they may say
  "build with what we have" (or equivalent) to proceed with only partial
  detail. Accept that immediately and move on — there is no hard
  completeness gate to satisfy first.
- If the incoming prompt already contains the topic, the style, and every
  step's content and visual description, skip straight to
  [Resolve target + detect anchors](#3-resolve-target--detect-anchors)
  without asking anything.
- You MAY draw a small ASCII mockup of a step whose layout is key or
  complex, and show it to the user to confirm before building. Do this only
  for steps that actually need it — not as a routine step for every step.

### 3. Resolve target + detect anchors

The scaffold a generated presentation depends on has three **contract
anchors**. Detection is contract-level (structural), not byte-identical —
cosmetic differences (file naming, formatting, extra dependencies) never
trigger re-scaffolding:

- **(a) Build setup** — a Vite + React + TypeScript app with a working
  `npm run build`.
- **(b) Scene kit** — the Step/Scene contract, and the Stage/nav/chrome
  engine, present under a `presentation-kit`-shaped module (i.e. something
  exposing `Presentation`, `Step`/`Scene` types, `Box`/`Label`/etc. node
  primitives, with the `data-presentation-*` DOM hooks).
- **(c) Presentation index** — an explicit registry file mapping
  `slug -> route -> lazy import`.

**Resolve the target location:**

- Empty directory, or a standalone (non-monorepo) project → scaffold at the
  repository root.
- Monorepo signal present (`workspaces` in `package.json`,
  `pnpm-workspace.yaml`, or a `packages/`/`apps/` layout) → scaffold a
  self-contained app under `presentations/` instead of mutating the monorepo
  root.
- All three anchors already present → reuse them; scaffold nothing.
- Non-empty project that is missing one or more anchors → state the
  resolved target location in plain language and get the user's explicit
  confirmation before writing anything.

**Always resolve `templates/` relative to this file's own directory**, never
relative to the current working directory. For example, in Node:

```js
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const skillDir = path.dirname(fileURLToPath(import.meta.url))
const bootstrapDir = path.join(skillDir, 'templates', 'bootstrap')
const presentationTemplatesDir = path.join(skillDir, 'templates', 'presentation')
```

Do not resolve these paths via `process.cwd()` or a relative path typed in
the shell — the skill may be invoked from any working directory.

### 4. Scaffold if needed

If any anchor is missing, copy `templates/bootstrap/` into the resolved
target for whatever is missing (do not overwrite anchors that already
exist), then install dependencies:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Dev/build: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`, the eslint stack (`eslint`,
  `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `globals`), and `playwright` (for the
  render check — also run `npx playwright install chromium` or equivalent so
  a browser binary is actually available).

Never assume any of these are already installed. Never add Tailwind or any
other styling framework unless the host project already uses one, or the
user explicitly asks for it.

### 5. Generate or modify

**Create** (new presentation):

1. Write a new presentation folder (e.g. `src/presentations/<slug>/` at the
   resolved target) containing:
   - `entities.ts` — this presentation's `layoutId` namespace. See
     `templates/presentation/entities.ts.template`.
   - `steps/*.tsx` — one or more `Step` objects composing kit primitives
     (`SceneLayer`, `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
     `SymbolChip`, `Appear`) into each step's `Scene`. See
     `templates/presentation/step.tsx.template`.
   - `Talk.tsx` — renders
     `<Presentation steps={STEPS} title="…" initialMode="browse" />`. See
     `templates/presentation/Talk.tsx.template`.
   - Plain CSS owned by this presentation folder, styling its own
     `className`s and the kit's `data-presentation-*` hooks. Do not add a
     styling framework unless the host already has one or the user asked
     for one.
2. Register the presentation by adding **one** entry to the presentation
   index (`presentations/index.ts` or its monorepo-scaffolded equivalent).
   See `templates/presentation/registry-entry.ts.template`.
3. Never touch any other presentation's files while creating a new one.

**Modify** (existing presentation):

1. If no target presentation is named or the request is ambiguous, list the
   registered presentations (slug + title) and ask the user which one to
   modify. Do not guess.
2. Once the target is identified, ask only about the specific change
   requested (steps, entities, or style) — do not re-run the full Gather
   flow.
3. Before editing, read the target presentation's existing files
   (`entities.ts`, `steps/*.tsx`, `Talk.tsx`, its CSS) and the kit
   interfaces it uses (`src/presentation-kit/` or its scaffolded
   equivalent). Identify its existing `layoutId`/entity-naming conventions,
   its `groupKey` structure, and its styling conventions (class names, CSS
   file organization) so the edit matches the presentation's established
   patterns instead of introducing an inconsistent style.
4. Make a scoped edit limited to that presentation's files (plus the
   registry entry, only if the change affects it, e.g. a title change),
   following the conventions identified above.

### 6. Self-verify before reporting done

Before reporting completion:

1. Run the build (`npm run build`).
2. Run at least a first-step render check.
3. Run a browser visual composition check (screenshots or equivalent) of the
   first step, the last step, and any dense/key step. If the presentation is
   responsive-sensitive, also check a narrow viewport.
4. Prefer the project-local screenshot helper
   (`scripts/inspect-presentation.mjs`, invoked as
   `npm run inspect -- <slug>`) over any ad hoc script outside the project
   tree, so browser tooling resolves from local dependencies and screenshots
   are captured only after animations settle.
5. If the build, render check, or visual composition check fails, fix the
   issue and re-check. Never report success on a known failure.
6. Review every advisory warning the screenshot helper prints:
   - unmarked text/chrome overlap
   - indistinct active navigation state
   - missing, browser-default, or undersized attribution

   Fix genuinely accidental issues. Only mark a collision as intentional
   using the allow-overlap marker
   (`data-presentation-allow-overlap="true"`) when the overlap is actually
   part of the intended composition and stays readable — never use the
   marker to silence a real defect.

## Quality bar

Every generated or modified presentation must, before you report done:

- Build with no type errors.
- Render its first step with no console or runtime errors.
- Show a caption for every step.
- Support next/previous navigation.
- Pass the visual composition check (first, last, and dense/key steps; a
  narrow viewport too, if responsive-sensitive).

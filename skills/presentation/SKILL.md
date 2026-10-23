---
name: presentation
description: Creates or modifies a browser presentation modeled as one evolving diagrammatic scene (stable entities that appear, move, connect and re-label across named steps). Self-bootstraps the Vite + React + TypeScript scaffold and scene kit when missing. Use when asked to make, create, build, update or change a presentation, talk or deck from a topic.
---

# Presentation

Build a browser presentation as **one evolving scene**, not a deck of disconnected slides.
"Presentation" is the canonical term; "talk" is an informal synonym (the per-presentation
entry file is named `Talk.tsx`, which is incidental).

The skill is hybrid: this document is the procedure and quality bar; the templates and the
vendored scene kit keep generated output consistent.

## Paths

Every path below that starts with `templates/` or `scripts/` is **relative to the directory
containing this `SKILL.md`**, never to the user's current working directory. Resolve the skill
directory first (call it `$SKILL`), then use `$SKILL/templates/bootstrap/`,
`$SKILL/templates/presentation/` and `$SKILL/scripts/detect-target.mjs`.

## The scene model

- A presentation is one scene rendered through an ordered list of named **steps**. Each step
  has a stable `id`, an `era` (section) label, a one-line presenter `title`, a paragraph browse
  `caption`, and a diagram state (`payload`).
- Entities keep a **stable id** (used as the motion `layoutId`) across steps, so persisting
  entities morph in place. Wrap only **newcomers** in `<Appear>`; entities present in two
  adjacent steps are never faded in again. Entities that leave exit with the `SceneLayer`.
- Adjacent steps that are successive states of one diagram share a `groupKey` and the same
  `Scene` component, so the scene instance persists and only `payload` changes.
- Preserve intentional overlaps or stacking in the composition; do not spread entities out
  only to satisfy a pattern.
- The kit is **style-neutral**: it owns behavior, geometry and `data-presentation-*` hooks,
  never colors, fonts, borders, shadows, spacing scale or buttons.

## Procedure

### 1. Gather

Ask the user clarifying questions **one at a time**, covering:

1. the topic,
2. the visual style,
3. each step's content and visual description.

Rules:

- Never invent a detail the user can still provide. If the prompt omits the topic, the style
  or the per-step descriptions, ask for them — one question per message — before assuming.
- The user controls the depth. If they choose to build with only some details, accept that
  explicit choice and generate from what was captured; there is no completeness gate, and the
  user can iterate afterwards.
- If the prompt already contains the topic, style and all step details, proceed without more
  questions.
- When a step's layout is key or complex, you may draw an ASCII mockup to confirm it. Do this
  only for selected key or complex steps, not for every step.

### 2. Resolve the target and scaffold what is missing

Detect the three **contract anchors** (presence, not a byte-identical scaffold, so naming,
formatting and extra dependencies never trigger re-scaffolding):

1. **Build setup** — a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit** — `src/presentation-kit/` (step contract, stage, nav, chrome, fit-scale canvas).
3. **Presentation index** — `src/presentations/index.ts`, the registry mapping each
   presentation to its own route.

Run `node "$SKILL/scripts/detect-target.mjs" <project-dir>`; it prints the anchors, the target
directory and whether confirmation is needed. Resolution order:

1. Anchors already present in an existing presentation app (the directory itself, or its
   `presentations/` app) → **use that app**.
2. **Monorepo** (`workspaces` in `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or
   `apps/` directory) → scaffold a **self-contained app under `presentations/`** with its own
   `package.json` and dependencies. Never mutate the monorepo root's build setup.
3. Empty directory or standalone (non-monorepo) project → scaffold **at the root**.

Scaffolding:

- **All three anchors absent** → full scaffold: copy `$SKILL/templates/bootstrap/` into the
  target (it already contains the build setup, the kit and an empty registry), then install
  dependencies.
- **All three present** → skip scaffolding entirely and go straight to step 3.
- **Some present** → copy only the missing anchors (and their dependencies). Do not overwrite
  or disturb anchors, presentations or unrelated files that already exist.
- Do this before creating **or modifying** a presentation.
- **Never assume dependencies are installed.** Ensure the full set and run `npm install`:
  runtime `react`, `react-dom`, `motion`, `lucide-react`; dev/build `vite`,
  `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the
  ESLint stack (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `globals`), and `playwright` (render verification; install
  Chromium with `npx playwright install chromium`). The bootstrap `package.json` and lock file
  list exactly this set; merge them into an existing `package.json` rather than replacing it.
- The scaffold is **styling-framework-neutral** with zero presentation styling defaults. Add
  Tailwind or another framework only when the host project already uses it or the user
  explicitly asks for it.
- Keep `src/presentation-kit/` byte-identical to the template copy; do not edit the kit to
  style a presentation.
- Copy the root `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, `scripts/lib/` and
  `verify.config.json` from the bootstrap template along with the build setup so the
  project-local verification and screenshot helper exist.

**Confirmation.** In a non-empty project (anything besides an empty directory or a bare
`.git`), if any scaffold write is needed — including a missing build setup alone — **state the
resolved target location and wait for the user's confirmation before writing anything**. Empty
targets, and projects where all anchors already exist, need no scaffold confirmation.

### 3. Generate or modify

**Create.** Write the presentation as its own self-contained folder
`src/presentations/<slug>/` from `$SKILL/templates/presentation/`:

- `entities.ts` — the presentation's `layoutId` namespace (stable entity ids and geometry),
- `steps/*` — the `Step` objects composing kit primitives (`Box`, `Label`, `Arrow`, `Frame`,
  `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`) or raw `motion` elements with stable
  `layoutId`s,
- `Talk.tsx` — `<Presentation steps=… title=… initialMode=… />` with a root `className`,
- `talk.css` — the look.

Replace the `{{TITLE}}`, `{{SLUG}}` placeholders, then **register** the presentation with one
added line in `src/presentations/index.ts`
(`{ slug, title, load: () => import('./<slug>/Talk') }`). Registration is additive: it makes
the presentation reachable at `/<slug>` and never replaces or removes other entries. Existing
presentations stay intact and reachable.

**Style ownership.** The look lives in files owned by the presentation (`talk.css`) or the
host app, never in the reusable kit. Plain CSS is the default; use Tailwind or another
framework only if the host already does or the user explicitly requests it. Presentation CSS
must make the **active step visibly distinct** (`[data-presentation-active="true"]` on the
progress indicators and table-of-contents entries) and the **attribution legible**
(`[data-presentation-attribution]`: not browser-default, not tiny).

**Modify.** Identify the target presentation first. If the user did not name one, or the
name is ambiguous, **list the existing presentations (from the registry) and ask which one to
modify before changing anything**. Once identified, ask only about the requested changes —
steps, entities or style — and make scoped, in-place edits to that presentation. Do not
re-walk the full create interview, and leave other presentations untouched.

### 4. Self-verify before reporting done

Never report success until all of these pass; if one fails, fix the cause and re-check.

1. **Build** — `npm run build` completes with no type errors.
2. **Render** — at minimum the first step renders at `/<slug>` with no runtime or console
   errors. Run the full `npm run verify` (build plus a real-browser pass through every step)
   before completion.
3. **Visual composition** — capture settled screenshots with the **project-local helper**
   `npm run inspect -- <slug>` (writes `.inspection/<slug>/step-NN.png`, waits for transitions
   to settle, prints `WARN step N: …` advisories). Inspect the **first step, the last step and
   any dense or key steps**; for responsive-sensitive presentations also run
   `npm run inspect -- <slug> --viewport 390x844` and inspect the narrow result. Prefer this
   helper over ad hoc scripts outside the project tree so browser tooling resolves from the
   project's own dependencies; if no helper exists, write any temporary Playwright script
   **under the project root**, never outside it.
   Confirm important content fits the fixed canvas, intentional overlaps stay readable, and
   nothing collides with chrome (captions, progress indicators, table of contents, navigation).
4. **Review every warning** the helper prints. For each referenced step: fix accidental text or
   chrome collisions, fix indistinct current-step chrome and unpolished attribution (via
   presentation CSS), then rerun. Mark an overlap as allowed
   (`data-presentation-allow-overlap` on the smallest subtree) **only** when it is intentional
   *and* readable; never use the marker to hide an accidental collision. Do not declare success
   while any defect remains, and report the final check results and remaining advisory status
   accurately.

## Quality bar

Every generated presentation builds with no type errors, renders its first step without
runtime errors, shows a caption per step, supports next/previous navigation, passes the visual
composition check, and follows the evolving-scene model above.

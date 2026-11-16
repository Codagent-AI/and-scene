---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with stable entities, named narrative beats, and verified output. Self-bootstraps a portable React scene app.
---

# Presentation

Use this procedure for a new topic or a scoped edit. The artifact is a
**presentation**; `Talk.tsx` is just its entry filename. Keep work in the target
project. Resolve this file's absolute directory first: every `templates/` and
`scripts/` path below is relative to this SKILL.md, never to the caller's cwd.

## Gather or modify

For creation, retain supplied details. Ask one question at a time for missing
information: topic, audience/context as useful, visual direction, then each beat's
content and visual description. Each beat needs a one-line title, paragraph
caption, era, and visual state. Ask what stays, changes, enters, or exits between
beats. Do not invent details while the user can still supply them. The user owns
the depth gate: offer to build with partial detail and iterate, and proceed when
they explicitly choose that. A fully specified prompt needs no extra interview.
An ASCII sketch is optional for a key or complex layout; do not require one for
every beat. Record the captured outline in the presentation folder.

For modification, identify the target first. If unspecified or ambiguous, list
registered presentations and ask which one before changing files. With a clear
target, ask only about requested step/entity/style changes; do not repeat the
creation interview. Preserve unrelated presentations, their files and routes.

## Resolve infrastructure

Inspect contracts, not exact filenames or formatting. Locate:
1. A Vite + React + TypeScript build setup with a working `npm run build`.
2. A topic-agnostic scene kit exposing the typed Step/Scene contract, morphing
   stage, navigation/modes/chrome, and fit canvas.
3. An explicit presentation index mapping slugs to separately loadable routes.

An equivalent implementation with cosmetic differences or extra dependencies
counts as present. Reuse all existing anchors. Scaffold only missing anchors and
their dependencies, preserving working setup and unrelated content. With none,
create all three. Do not assume dependencies are installed.

Resolve the target before writes:
- Already in a presentation app: use it and fill only missing anchors.
- Otherwise a monorepo signal (`package.json` workspaces, pnpm-workspace.yaml,
  or packages/ or apps/ layout): use a self-contained `presentations/` app. Do
  not replace the monorepo root build setup. Existing root build infrastructure
  remains untouched; it is not the new app's build anchor.
- Empty or standalone project: use its root.

In a non-empty project lacking kit or index, state the proposed absolute target
and get confirmation before writing. Do not overwrite colliding files: inspect
and integrate missing behavior into their existing contracts after confirmation.
The empty-target copier is optional: run
`node <absolute-skill-directory>/scripts/materialize.mjs <absolute-target>`.
It resolves `templates/bootstrap/` from its own location and refuses non-empty
targets. For a partial scaffold, copy just missing kit/index/build pieces from
that snapshot; merge scripts and dependencies into the existing package manifest,
wire routes without dropping existing entries, and regenerate lock data using
npm install. Never copy a fresh lock over a merged manifest.

Ensure runtime react, react-dom, motion, lucide-react; dev/build vite,
@vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/node,
eslint, @eslint/js, globals, typescript-eslint, eslint-plugin-react-hooks,
eslint-plugin-react-refresh, and playwright. The bootstrap also includes Vitest,
jsdom and testing-library for fast contract tests. Install with `npm ci` for an
unchanged fresh snapshot, or `npm install` after merging. Install Chromium with
`npx playwright install chromium` if unavailable.

The bootstrap is deliberately unstyled. Do not add Tailwind, a Tailwind plugin,
a default theme, fonts, palette, spacing scale, borders, shadows, cards, or
button styles to the reusable kit or scaffold. A host's existing framework or
an explicit user request may supply a styling framework in host/presentation
files. Plain presentation-local CSS is the default.

## Generate the evolving scene

Use `templates/presentation/` as the minimal pattern. Create
`src/presentations/<slug>/entities.ts`, `steps/`, `Talk.tsx`, the captured outline,
and presentation-local CSS. Use unique stable IDs namespaced to that presentation.
Register one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` entry
without removing other entries. Confirm the landing index links every entry.

Build one evolving diagram, not independent slides. Compose generic primitives
from the kit; raw motion elements with stable layoutId are welcome for coordinate
heavy shapes. Use the 880 × 380 design canvas, preserving literal coordinates as
it scales. Keep scene content inside it. Continuing entities keep IDs and morph
position/size/label/emphasis; departures exit. Use Appear only for newcomers,
with entry after LAYOUT_T; never key continuing entities by step index. Adjacent
states of one diagram share a groupKey and Scene, varying typed payload only.
Use AnimatePresence for departing entities and SceneLayer for absolute layers.
Do not flatten intentional readable stacks to fit a component pattern.

Each Step carries id, era, title, caption, Scene and payload; numbering is derived
from order. Presentation owns navigation, fit geometry, and browse/present chrome.
Style the provided data-presentation-* hooks locally: clearly distinct active
progress and ToC entries, legible default bottom-right attribution, readable
captions, navigation and focus states. Branding at top-left is host opt-in.
Do not introduce visual defaults into the kit. Preserve existing presentations.

## Completion gate and repair

Run `npm run build`, then `npm run verify -- <slug>` to render every step of the
created/modified route in Chromium against the production preview. At minimum
the first step must render without runtime or console errors; never report
success when a build or render check fails. The default verify command checks
the canonical reference's full nine-step outline if it is the target.

Run `npm run inspect -- <slug>` using the project-local screenshot helper when
available. It captures every settled step and reports advisory warnings. If no
helper exists, add a temporary Playwright helper **under the project root** so
it resolves local dependencies; do not write it outside the project. Use
127.0.0.1 for local server/probe/browser addresses.

Before reporting success, review screenshots or equivalent browser views for
first, last and dense/key steps. Also run `npm run inspect -- <slug> 390 844`
and review representative narrow views for responsive-sensitive work. Inspect
canvas fit, legibility, intentional overlap, and collisions with captions, ToC,
progress and navigation. When interactive browser inspection is used here,
prefer chrome-devtools-axi, start with its snapshot, then capture screenshots.

Review every cited warning step. Fix accidental collisions, indistinct active
navigation and browser-default or tiny attribution in presentation/host CSS.
Only mark intentional readable overlapping subtrees with
`data-presentation-allow-overlap`; never silence a real collision. Warnings are
advisory evidence requiring review, not an automated visual-quality verdict.
Repair build, runtime, transition, or composition failures yourself and rerun
the affected checks and inspection. Report generated/changed route, checks run,
visual review and any remaining intentional advisory warnings accurately.

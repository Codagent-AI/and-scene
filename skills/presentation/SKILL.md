---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with a reusable React scene kit, self-bootstrapping scaffold, and build/render/visual verification.
---

# Presentation

Use this procedure to turn a topic into a browser presentation or edit an existing
one. A presentation is one diagram evolving through named steps, not disconnected
slides. `Talk.tsx` is only the entry filename; use “presentation” everywhere else.

## 1. Gather or identify the target

For a new presentation, first use the supplied detail. If topic, visual direction,
or a step's content and visual description are missing, ask for the missing detail
**one question at a time**. Gather each beat's title, caption, diagram, and what
persists, enters, leaves, or morphs into the next beat. Do not invent details the
user can still supply. A complete prompt needs no redundant interview. The user
controls depth: when they explicitly choose to build with partial detail, proceed
from what was captured; there is no mandatory completeness gate. Make ordinary
layout choices within that authorization and iterate. For a key or complex layout,
an ASCII mockup may help confirm it; do not require mockups for every step.

For modification, identify the target before editing. If the target is unclear,
list the existing registry entries and ask which presentation to modify. After it
is identified, ask only about the requested changes to steps, entities, or style.
Do not repeat the full creation interview. Preserve unrelated presentations.

## 2. Resolve the app and missing infrastructure

Resolve all paths below **relative to the directory of this SKILL.md**, never to
the caller's current working directory. The bootstrap snapshot is
`templates/bootstrap/`; reusable authoring templates are `templates/presentation/`.
The fresh-directory copying helper is `scripts/materialize.mjs` beside this file.

Inspect the project for three contracts, not exact filenames or formatting:

1. A Vite + React + TypeScript build setup with working `npm run build`.
2. A reusable scene kit providing typed Step/Scene payloads, persistent grouped
   scenes, motion host, navigation, present/browse chrome, and fit scaling.
3. An explicit presentation registry and routes supporting multiple presentations.

Extra dependencies, cosmetic naming changes, and formatting differences do not
mean an anchor is missing. If already inside a presentation app, reuse it and add
only missing anchors. Never overwrite working infrastructure just to match the
snapshot. When all three anchors exist, skip scaffolding.

If there is no presentation app, detect a monorepo from package.json `workspaces`,
`pnpm-workspace.yaml`, or an `apps/` or `packages/` layout. In a monorepo target a
self-contained `presentations/` app, preserving root build setup and unrelated
content. In an empty or standalone project target the root. If a project is
non-empty and lacks the kit or registry, **state the resolved target and wait for
the user's confirmation before writing scaffold files**. Existing authorization
for that exact target need not be requested again.

If none of the anchors exists, copy the full bootstrap. In a fresh empty target,
run `node <absolute-skill-directory>/scripts/materialize.mjs <target-directory>`.
The helper refuses non-empty targets; do not remove their contents to bypass it.
In a partial scaffold, selectively copy only missing anchors and merge necessary
package scripts, dependencies, imports, and routing; preserve existing anchors and
all presentation registrations. The agent must adapt to equivalent host contracts.

Ensure the complete dependency set; do not assume installation:

- Runtime: react, react-dom, motion, lucide-react.
- Build/dev: vite, @vitejs/plugin-react, typescript, @types/react,
  @types/react-dom, @types/node, eslint, @eslint/js, typescript-eslint,
  eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, playwright.

For full bootstrap run `npm ci` from its lock data. For partial scaffolds merge
required declarations and install them with the host's package manager, preserving
unrelated dependencies. Install Chromium with `npx playwright install chromium`
when unavailable. The snapshot is plain CSS and framework-neutral: no Tailwind,
Tailwind plugin, theme tokens, default presentation colors/fonts, spacing scale,
card/button styles, borders, or shadows. A host's existing or explicitly requested
styling framework may be used, but never make it a kit dependency.

## 3. Create or modify the presentation

Create `src/presentations/<slug>/entities.ts`, `steps/*`, `Talk.tsx`, and optional
presentation-local CSS using the authoring templates as a starting point. Use a
lowercase hyphenated slug. Namespace stable entity IDs per presentation. Each
step carries id, era, one-line presenter title, paragraph browse caption, Scene,
and typed payload. Numbering derives from order. Use one Scene and groupKey for
adjacent beats of the same diagram so only payload changes, retaining its mounted
instance. Keep continuing entities keyed with stable layoutId values. Use
AnimatePresence for independently keyed entering/leaving entities; delay newcomer
entry until persisting layout motion settles. Never wrap the continuing diagram
in a fresh Appear. Preserve intentional readable stacks and overlaps.

Use generic Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear, and SceneLayer
from the kit. Raw motion elements with stable layoutIds and literal coordinates
are appropriate when a primitive is not the right shape. Fixed-canvas default is
880 × 380. Keep coordinates and layering authored; fit scaling changes the whole
canvas uniformly, not its internal layout. Layout and motion belong in the kit;
all colors, typography, spacing, borders, shadows, and control treatments belong
in the presentation's CSS or host app. Plain CSS is the default unless the host
already uses a framework or the user requested one.

Register a new presentation with one explicit `{ slug, title, load: () =>
import('./<slug>/Talk') }` entry in the existing index. Preserve all other folders,
entries, and routes; ensure landing lists them. Do not overwrite the registry.
For modifications, edit the identified presentation and only necessary shared
integration artifacts. Retain stable entity identities and unrelated content.

Style progress, ToC, navigation and attribution through `data-presentation-*`
hooks. Active controls expose `aria-current="step"` and
`data-presentation-active="true"`; make them visibly distinct locally. Keep the
bottom-right `made by and-scene` GitHub attribution legible (at least 11px), styled
intentionally rather than browser-default. Header branding is host opt-in.
The kit has zero fallback visual styling; do not add a theme to it.

## 4. Verify and repair before completion

Run `npm run build` for the whole app. Run `npm run verify -- --route <slug>` for
the generated/modified route: at minimum the first step must render without any
console.error or pageerror; this helper checks all steps through public count/index
hooks. Also run the project's normal `npm run verify` completion gate (in this
repository it validates the canonical nine-step reference). All preview hosts,
readiness probes and browser URLs must use `127.0.0.1`.

A build or browser failure is not completion: fix the cause and rerun the affected
checks. Every step needs a caption and next/previous navigation, and the result
must retain the evolving-scene model.

Perform a browser visual composition check. Prefer the project-local
`npm run inspect -- <slug>` helper: it resolves local Playwright dependencies,
builds a production preview, captures every step after animations settle under
`artifacts/inspection/<slug>/<width>x<height>/`, and prints advisory diagnostics.
If unavailable, keep any temporary Playwright helper **under the project root**.
Inspect first, last, and dense/key step screenshots or equivalent browser views;
for responsive-sensitive presentations also run the helper with `--width 390
--height 844` and review representative narrow steps. If AXI is available for
interactive review, start with `chrome-devtools-axi snapshot` and then screenshots.

Check that important content fits the canvas, intentional overlaps remain readable,
and no scene text collides with captions, progress, ToC, or navigation. Review each
step cited by overlap/active-state/attribution warnings. Repair accidental
collisions, indistinct current-step chrome, and tiny/default attribution locally;
rerun inspection and review the affected images. Only intentional readable
composition may be exempted with `data-presentation-allow-overlap` on the smallest
appropriate subtree. Do not blanket-exempt the scene or silence diagnostics.
Warnings and screenshots support review, not an automated taste score. Do not
report success until functional checks pass and visual review is coherent.

Report the route, changed files, build/render checks, visual views reviewed, and
any remaining advisory warnings accurately. Never claim unperformed checks.

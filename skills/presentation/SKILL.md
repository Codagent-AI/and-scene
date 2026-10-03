---
name: presentation
description: Creates or modifies browser-based React presentations as one evolving diagram scene. Use when asked to create, scaffold, edit, or add steps to a presentation, slide deck, or talk, or when the user mentions presentation, slides, deck, or scene.
---

# Presentation skill

Use this procedure whenever asked to create, scaffold, or modify a presentation.
The reusable engine is `src/presentation-kit/`; presentation-specific entities,
steps, and visual design belong in a separate presentation folder.

This workflow creates browser-based React presentations. It does not edit native
PowerPoint, Keynote, or Google Slides decks, export PPTX/PDF/images, or publish a
hosted site. Use an existing slide-editing workflow for those requests.

## 1. Identify the requested work and gather details

First decide whether the request is to create a new presentation or modify an
existing one. For modifications with no unique target, inspect
`src/presentations/index.ts`, list the registered titles/slugs, and ask which one
to change before editing. Once selected, ask only about the requested change.
Do not re-run the creation interview for a scoped edit.

For a new presentation, gather the topic, visual direction, and for each planned
step its narrative purpose/content and intended visual state. Ask for missing
information one question at a time, waiting for the answer before asking the
next question. Do not silently invent details the user can still provide. The
user may explicitly choose to proceed with partial details; record what remains
open, make only reasonable connective choices, and build without a completeness
gate. A complete prompt needs no further questions. Offer a small ASCII layout
sketch only when a key or complex composition would benefit from confirmation;
do not sketch every step by default.

## 2. Resolve the target and inspect scaffold anchors

Resolve all template locations from this SKILL.md file, never from the current
working directory. The distributable files are under `templates/`.

Look for these three anchors at the contract level, allowing cosmetic variation:

1. **Build setup:** package scripts/dependencies support a Vite + React +
   TypeScript app whose `npm run build` succeeds.
2. **Scene kit:** a reusable kit exports the typed Step/Scene contract, active
   scene stage/host, navigation and present/browse chrome, and fit-scaled canvas.
3. **Presentation index:** an explicit or equivalent registry maps distinct
   presentation slugs to their own routes.

If all exist, use the project as-is. If only some exist, preserve those and
scaffold only missing contracts and their required dependencies. Do not replace
an existing kit or registry simply because its filenames differ.

Choose where to scaffold before writing:

- Empty directory or standalone project: repository root.
- Monorepo (package.json workspaces, pnpm-workspace.yaml, or a packages/ or
  apps/ layout): a self-contained app in `presentations/`.
- Already inside a presentation app with anchors: that app.

In a non-empty project that lacks the scene kit or presentation index, state the
resolved destination and ask for confirmation before writing there. Preserve
unrelated content. For a monorepo, put the app's package, lockfile, source,
scripts, and build config under `presentations/`; do not mutate root project
configuration. Copy the whole `templates/bootstrap/` tree for a full scaffold.
For partial scaffolds, copy only needed pieces after checking their imports and
local paths: the kit snapshot maps to `src/presentation-kit/`; app shell files
map to `src/main.tsx`, `src/Landing.tsx`, `src/route.ts`, and `src/index.css`;
the registry template maps to `src/presentations/index.ts`; build/lint files and
`index.html` map to the app root; helpers go in `scripts/`. The starter route is
an example, not a required extra presentation.

## 3. Ensure dependencies and neutral scaffold

The scaffold dependency contract includes runtime `react`, `react-dom`,
`motion`, `lucide-react`; build/type dependencies `vite`, `@vitejs/plugin-react`,
`typescript`, `@types/react`, `@types/react-dom`, `@types/node`; the ESLint stack
(`eslint`, `@eslint/js`, `globals`, `typescript-eslint`,
`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`); and `playwright` for
real browser checks. Do not assume any are installed. Use the supplied package
manifest and lockfile when creating an app; if merging into an existing app,
preserve its package setup and add only missing packages, then refresh its lock
data and install. Tailwind or another styling framework is optional and may be
used only if the host already has it or the user requests it.

Keep the reusable kit style-neutral. It may define geometry and behavior, but no
palette, typography, spacing scale, border, shadow, card/button treatment, theme
tokens, or framework configuration. Put the intended look in the presentation's
own plain CSS by default. Copy the example from `templates/presentation/` as a
starting point; use `templates/step.tsx` as a shape reference, adjusting its
relative imports to the destination.

## 4. Create or modify the presentation

Create a self-contained folder under `src/presentations/<slug>/` with its own
scene/entity identifiers, typed step data, scene components, and presentation
CSS. Follow local conventions if an existing project differs. Register a new
slug/title/route in the presentation index without editing or deleting other
entries. Stable entity IDs must persist across states when a diagram object
continues; model a presentation as an evolving scene, not unrelated slide cards.
Each step needs a stable id, section/era, presenter title, explanatory caption,
and visible diagram state. Keep numbering derived from array order.

When modifying, edit only the selected presentation and the minimal necessary
registry or shared integration files. Do not rewrite unrelated presentations.

## 5. Build, render, and inspect before reporting success

Run `npm run build` in the app root and fix errors. Then run the local browser
verification (`npm run verify -- <slug>`) when present; at minimum it must build
and open the new route in Chromium without page or console errors. If the app has no
`verify` script, add/run an equivalent Playwright smoke check inside the project
root, using the local dependencies and `127.0.0.1` for preview.

Inspect the result visually in a browser. Prefer the project's
`npm run inspect -- <slug>` helper; it captures each settled step into
`artifacts/presentation-inspection/<slug>/` and reports advisory warnings. If
unavailable, create any temporary Playwright helper inside the project root and
remove it after use. Review the first and final screenshots plus every dense or
key transition. If responsive-sensitive, repeat at a narrow viewport. Fix
accidental clipping/collisions, unreadable intentional overlaps, indistinct
active progress/contents state, and missing/default/tiny attribution. Mark an
overlap with `data-presentation-allow-overlap` only when it is deliberate and
readable. Rerun build, render, and inspection after fixes.

Report completion in this shape, omitting any inapplicable row:

```text
Presentation: <title> (<route>)
Changed: <brief file/scene summary>
Checks: build <pass/fail>; browser render <pass/fail>; visual inspection <steps/viewports>
Advisories: <remaining warnings or none>
```

Never claim checks passed if they were not run or failed.

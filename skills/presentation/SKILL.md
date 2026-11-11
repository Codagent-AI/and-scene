---
name: presentation
description: Create or modify browser presentations as one evolving scene, with a reusable React kit and production verification.
---

# Presentation

## Gather the story

Ask one question at a time for missing information, starting with the topic,
then visual style, then the content and visual description of each step.
Capture each beat's title, browse caption, diagram, and what persists or morphs
from the prior beat. The user controls depth. Ask before filling details the
user can still provide. When they explicitly choose to build with partial
information, generate from what was captured and iterate. A complete prompt can
proceed directly. Optionally draw an ASCII mockup for a complex or important
layout when it helps confirm composition.

For a modification, first identify the presentation. If the target is ambiguous,
list registry entries and ask which to edit before changing files. Once selected,
ask only about the requested changes, then edit that presentation's steps,
entities, or styles. Preserve all other presentations and avoid restarting the
creation interview.

## Resolve the app

Resolve this SKILL.md's directory as SKILL_DIR from its installed absolute path.
Bootstrap assets are SKILL_DIR/templates/bootstrap and presentation templates are
SKILL_DIR/templates/presentation. Resolve both from this file, independently of
the caller's current working directory.

Inspect the host for three semantic anchors. Equivalent names and formatting,
extra dependencies, and cosmetic differences are valid.

- A Vite + React + TypeScript build setup with a working npm run build.
- A scene kit implementing typed steps, grouped scenes, layout morphs, navigation,
  present/browse chrome, captions, ToC, and fit scaling.
- A presentation registry with independent routes and a landing index.

If inside an existing presentation app, use that app. Otherwise detect a monorepo
using package.json workspaces, pnpm-workspace.yaml, or packages/ or apps/ layouts.
For a monorepo, target a self-contained presentations/ app. For an empty or
standalone project, target its root. Preserve the monorepo root build and all
unrelated files. Evaluate anchors in the resolved target, without assuming a
workspace-root build is a presentation-app build.

In a non-empty project missing the scene kit or registry, state the resolved
target and obtain confirmation before scaffolding. Existing authorization for
that precise target can satisfy confirmation.

Reuse all existing anchors. If all anchors exist, skip scaffolding. If none
exist, copy the full bootstrap snapshot. For a partial scaffold, copy only the
missing anchor files, merge necessary scripts/dependencies, and integrate imports
into existing entry points without overwriting working host code. Do not require
byte identity to this template. Inspect conflicts and adapt integration to the
host's actual contracts. Copy the kit from the snapshot as a coherent unit when
it is absent.

Ensure dependencies for every added anchor are installed. Full scaffolding needs
react, react-dom, motion, lucide-react, vite, @vitejs/plugin-react, typescript,
@types/react, @types/react-dom, @types/node, @eslint/js, eslint,
eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals,
typescript-eslint, and playwright. Use the committed lock data with npm ci for a
full unmodified bootstrap. Use npm install when merging dependencies into a host.
Install Playwright Chromium with npx playwright install chromium when needed.
Do not assume packages or browsers are already installed.

The bootstrap example is deliberately unstyled. Replace it with authored
presentations or keep it as a neutral contract example. Bootstrap npm run verify
checks example; pass a generated slug to node scripts/verify.mjs <slug> for a
route-specific check. The root project's default verifies the reference sample.

## Create or modify

Use templates/presentation as a structural guide. Create
src/presentations/<slug>/entities.ts, steps/, Talk.tsx, and local CSS. Choose a
unique slug and stable, namespaced entity IDs. Register one explicit
{ slug, title, load: () => import('./<slug>/Talk') } entry. Preserve every existing
entry and folder. The landing page lists entries and each route loads lazily.

Compose one diagram through ordered named steps using the kit. Every step needs
id, era, title, caption, Scene, and payload. Derive numbering from array order.
Use a typed payload and the same Scene and groupKey for related evolving beats.
Keep continuing entities mounted with stable keys and layoutId. Let newcomers
enter after layout motion, and retain exit animation for departing entities.
Use absolute SceneLayer geometry so layers cannot reflow each other. Preserve
intentional stacking. Kit primitives accept class/style/data hooks. Raw Motion
elements with stable layoutId are available for coordinate-heavy custom shapes.

Own palette, fonts, spacing, cards, borders, shadows, buttons, and themes in
presentation or host CSS. Plain CSS is the default. Use a framework only when the
host already uses it or the user explicitly requests it. Keep the reusable kit
free of visual defaults and framework dependencies. Style
[data-presentation-progress-entry][data-active="true"] and
[data-presentation-toc-entry][data-active="true"] distinctly. Style
[data-presentation-attribution] legibly and intentionally. The default attribution
links to the toolkit repository. Header branding is host opt-in.

## Verify and repair

Run npm run build, then node scripts/verify.mjs <slug> to build and render every
step of the generated or modified route in a production Chromium preview. At a
minimum a first-step browser render must be clean. Run npm run verify for the
canonical reference sample where present. Fix type, build, console, runtime, and
transition failures and re-run affected checks before reporting success.

Use npm run inspect -- <slug> for project-local settled per-step screenshots and
advisory diagnostics. Prefer this helper over ad hoc browser scripts. If it is
unavailable, place any temporary Playwright helper under the project root so it
uses local dependencies. Inspect the first, last, and dense/key steps. For
responsive-sensitive compositions also run npm run inspect -- <slug> 390 844 and
review those views. Use chrome-devtools-axi for interactive browser inspection
when available, beginning with a structure snapshot.

Check important content fits the fixed canvas, readable intentional overlaps,
and separation from captions, progress, ToC, navigation, and attribution. Review
all advisory warnings at their reported steps. Repair accidental collisions,
indistinct active navigation, and unpolished attribution in local CSS. Add
[data-presentation-allow-overlap] only to intentional, readable overlap subtrees.
Re-capture and review after fixes. Warnings and screenshots are review aids.
They do not replace production render pass/fail checks. Report completion only
after build, render, and visual composition review succeed, and accurately report
remaining advisory status and check results.

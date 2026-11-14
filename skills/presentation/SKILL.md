---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with a neutral React scene kit and build/render/visual verification.
---

# Presentation

Use this procedure to create a presentation from a topic or modify an existing
presentation. The deliverable is a browser route, not disconnected slide images.

## Gather the story

Read all supplied details first. If the topic, visual direction, or any step's
content and visual description are missing, ask **one question at a time**. Do
not invent information the user can still supply. Ask about the topic, then the
look, then each beat: title, paragraph caption, visible entities, and what stays,
enters, leaves, or morphs from the previous beat. Offer an ASCII mockup for a key
or complex composition when it helps; it is optional, not required per step.

The user owns depth. Explicitly allow “build with what we have” and iteration.
Once the user chooses partial detail, build from the captured material without
a completeness gate. If the prompt already contains all details, proceed without
redundant questions. Respect session-level authorization to make ordinary choices.

For modification, identify the presentation first. If the target is unspecified
or ambiguous, list the existing registered presentations and ask which one before
editing. Once identified, ask only about requested changes to steps, entities, or
style; do not repeat the full create interview. Preserve other presentations.

## Resolve the target and missing anchors

Locate this SKILL.md first. Resolve `templates/bootstrap/`,
`templates/presentation/`, and `scaffold-plan.mjs` relative to **this skill's
directory**, never relative to the caller's current working directory. The pure
`scaffoldPlan` helper takes semantic findings; it does not detect contracts by
filename. Inspect the target for these three independent anchors:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A reusable scene kit with typed steps/scenes, stage/morphs, navigation,
   present/browse chrome, captions/ToC, and fixed-canvas fit scaling.
3. A presentation registry with independent reachable routes.

Recognize equivalent contracts despite formatting, naming, or extra dependencies.
Never overwrite a working anchor merely because it differs from the template.
When all three exist, skip scaffolding. For partial scaffolds, merge **only the
missing anchors and their dependencies**, preserving existing build setup,
registry entries, unrelated files, and reachable presentations.

Resolve location before writing:

- Inside an existing presentation app, reuse that app and fill missing anchors.
- In a monorepo (`package.json` workspaces, `pnpm-workspace.yaml`, or an apps/
  or packages/ layout), create a self-contained `presentations/` app. Root build
  infrastructure is not an anchor of that nested app; preserve it unchanged.
- In an empty or standalone project, use its root.

If the project is non-empty and lacks the kit or index, state the resolved target
and what will be added, and **wait for confirmation before writing** unless the
session already explicitly authorized that exact action. Do not treat silence as
confirmation. Do not overwrite a conflicting non-presentation `presentations/`
directory; resolve a compatible location with the user before any writes.

For a full scaffold, copy the bootstrap snapshot including dotfiles and lock data
into the resolved target, excluding dependencies/build artifacts. For partial
scaffolds, copy the needed files and merge package scripts/dependencies rather
than replacing existing manifests. Preserve existing root infrastructure in a
monorepo. Run package installation in the resolved app: `npm ci` for an unchanged
snapshot, `npm install` for a merged manifest. Ensure the **complete** dependency
set, even if nothing was installed previously:

- Runtime: react, react-dom, motion, lucide-react.
- Build/dev: vite, @vitejs/plugin-react, typescript, @types/react,
  @types/react-dom, @types/node, eslint, @eslint/js, typescript-eslint,
  eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, playwright.
- Keep the supplied Vitest/testing-library dependencies if using its tests.

Install Chromium with `npx playwright install chromium` when unavailable.
The scaffold and reusable kit have **zero presentation styling defaults**. Do not
add Tailwind, a Tailwind Vite plugin, a default theme, colors, fonts, spacing
scales, borders, shadows, card or button treatments. A styling framework is an
opt-in host/presentation decision. Prefer plain CSS unless the host already uses
a framework or the user requests one.

## Create or modify

Use `templates/presentation/` as the authoring example. Give each new presentation
a unique kebab-case slug and its own `src/presentations/<slug>/` folder containing
`entities.ts`, `steps/`, `Talk.tsx`, and presentation-local CSS. Add one explicit
`{ slug, title, load: () => import('./<slug>/Talk') }` registry entry. Retain all
other entries and files. The landing page enumerates the registry; check that
existing routes remain registered. Do not replace the registry wholesale.

Steps have a stable id, era, presenter title, paragraph caption, Scene, payload,
and optional groupKey. Numbering is derived from order. Use strongly typed
payloads with `Step<MyPayload>[]` and `<Presentation steps={steps} ... />`; do not
cast away payload types. Adjacent beats of the same diagram should use the same
Scene and groupKey so payload changes update the mounted instance.

Namespace layout IDs in entities.ts. Persisting entities keep those IDs while
changing coordinates, size, label or emphasis. Put only **newly introduced**
entities in keyed Appear wrappers; wrappers retained under the same key do not
reenter. Use AnimatePresence for exits. Newcomers enter after layout movement.
Use kit Box, Label, Arrow, Frame, Emphasis, SymbolChip and SceneLayer; raw motion
elements with stable layoutId are allowed for coordinate-heavy diagrams. Preserve
intentional stacking rather than spreading a diagram to suit an implementation.

Compose within the 880 × 380 fixed canvas. SceneLayer prevents step reflow; the
host uniformly scales the canvas between mode-specific header/footer geometry.
Use stable `data-presentation-*` hooks for local styling. Keep all colors,
typography, spacing and control treatments in presentation/host files; never
style the reusable kit. Make active progress/ToC hooks visually distinct, and
style `[data-presentation-attribution]` legibly (at least 12px at viewport scale,
intentional color/font, not browser-default blue). Attribution defaults to
“made by and-scene” at bottom right. Top-left branding is host opt-in.

For scoped modifications, edit only the identified presentation and necessary
registration or verification artifacts. Preserve unrelated routes and anchors.

## Verify and repair before completion

Run `npm run build`. Then run `npm run verify -- --slug=<slug>` for the new or
modified route (at least first-step clean rendering is required; this helper
checks every step). Run the default `npm run verify` to verify the canonical
reference sample when it exists. Use production preview and browser URLs on
127.0.0.1 consistently. If build, runtime, console, or step-transition checks
fail, fix them and rerun affected checks before claiming success.

Run `npm run inspect -- <slug>` to capture settled per-step screenshots with the
project-local helper. Prefer this helper over ad hoc scripts so Playwright
resolves locally. If absent, put any temporary Playwright helper **under the
project root**, import its local dependencies, and wait beyond transition settle
time. For responsive-sensitive content also run
`npm run inspect -- <slug> --width=390`.

Review the first, last, and dense/key screenshots or equivalent browser views,
plus narrow views where responsive-sensitive. Check important content fits the
canvas, intentional overlaps remain readable, and captions, navigation, ToC,
and progress do not collide with scene content. Review every referenced warning:
fix accidental text/chrome collisions, indistinct active navigation, and missing,
undersized or browser-default attribution. Only mark a genuinely intentional,
readable overlapping subtree `data-presentation-allow-overlap="true"`; do not use
blanket exemptions to hide defects. Rerun affected capture/checks after fixes.
Warnings are advisory, not automated proof of visual coherence.

Every output must have captions, next/previous navigation, stable evolving-scene
identity, clean types/rendering and a completed visual composition review. Report
the route, changed files, build/render results, reviewed views, and any remaining
advisory status accurately. Never report success over a failed build, render or
composition check.

---
name: presentation
description: Create or modify a browser presentation as one evolving scene, with stable entities, typed steps, and verified output. Bootstraps missing infrastructure when needed.
---

# Create an evolving scene

Use this procedure to create a presentation from a topic or to modify a registered
presentation. A presentation is one evolving diagram, not disconnected slides.
Resolve this file's absolute directory first; every `templates/` or `scripts/`
path below is relative to **this SKILL.md**, never to the caller's working directory.
Keep implementation and temporary helpers inside the selected project.

## 1. Identify the request and gather details

For a modification, inspect the registry and identify the presentation first. If
the target is unspecified or ambiguous, list existing titles/slugs and ask which
one to modify **before editing anything**. Then ask only about the requested
steps, entities, or style. Do not repeat the full create interview.

For creation, retain all details already supplied. Ask for missing information
**one question at a time**, waiting for each answer: topic, visual style, then
each step's content (title and caption) and visual description. Ask what continues,
changes, appears, or departs between beats. Do not invent details the user can
still provide. The user controls depth: explicitly offer to build with captured
partial detail and iterate; when they choose that path, proceed without a hard
completeness gate. If the prompt is complete, proceed without redundant questions.
For a key or complex layout, optionally draw an ASCII mockup to confirm it;
mockups are not required for every step.

## 2. Resolve the target and infrastructure

Inspect contracts rather than comparing files to this snapshot. File names,
formatting, extra dependencies, and cosmetic differences do not mean infrastructure
is missing. Locate these three anchors and their equivalents:

1. A Vite + React + TypeScript build setup with a working `npm run build`.
2. A topic-agnostic scene kit with typed Step/Scene contracts, stage/entity morphs,
   grouped persistence, present/browse navigation and chrome, and fit scaling.
3. A presentation registry connecting multiple independently routed presentations.

If already inside a presentation app, reuse it. Otherwise, a package.json
`workspaces`, a `pnpm-workspace.yaml`, or a packages/ or apps/ layout identifies a
monorepo: select a self-contained **presentations/** app, preserving the root
build setup and unrelated files. Empty and standalone projects use their root.
In a non-empty project lacking scene kit or presentation index, **state the exact
target and obtain the user's confirmation before writing**. Reuse confirmation
already given for that target. Never replace a monorepo's root configuration.

If all anchors exist, skip scaffolding. If the selected target is empty and has
no anchors, copy `templates/bootstrap/` into it. You can run
`node <absolute-skill-dir>/scripts/scaffold.mjs <absolute-target>` for this empty
case only; the helper refuses non-empty directories. It locates the snapshot
relative to its own installed skill, independent of the working directory.

If the selected target is non-empty, merge **every missing anchor in place**
after the target confirmation above, whether zero, one, or two anchors exist.
In particular, a non-empty standalone project with no anchors receives all three
anchors at its existing root; do not redirect it into a new subdirectory merely
to obtain an empty target. Inspect every destination before copying: copy absent
files, merge required dependencies and build/verification scripts into existing
package metadata, and adapt configuration, source entry points, and router wiring
without replacing unrelated content. Preserve existing package fields, scripts,
source files, and documents; regenerate the lockfile with npm install after a
package merge instead of copying the snapshot lockfile over it. Add kit files
only when the kit is absent, and reuse any functioning build or registry anchor.
Do not invoke the full-copy helper for a non-empty target. Preserve all existing
presentations and functioning anchors.

Ensure dependencies are actually installed; do not assume any are present.
Runtime: react, react-dom, motion, lucide-react. Dev/build: vite,
@vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/node,
eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks,
eslint-plugin-react-refresh, globals, and playwright. The bootstrap includes
Vitest for fast tests. Run npm install after merging dependencies, or npm ci
when materializing its unchanged committed lockfile. Install Playwright Chromium
with `npx playwright install chromium` if no compatible browser is available.

The scaffold and kit have **zero presentation styling defaults**: no palette,
fonts, borders, shadows, spacing scale, card/button treatments, CSS theme tokens,
or required styling framework. Do not add Tailwind or its Vite plugin unless the
host already uses it or the user explicitly requests it.

## 3. Create or modify the presentation

Use `templates/presentation/` as structural guidance, adapting imports to the
host's existing anchors. Create `src/presentations/<slug>/entities.ts`, `steps/`,
`Talk.tsx`, and presentation-local CSS, and add exactly one explicit
`{ slug, title, load: () => import('./<slug>/Talk') }` registry entry. Keep old
entries and files intact and reachable. Use a unique slug and a presentation-local
entity ID namespace. Do not change an existing presentation to create a new one.
For modification, edit only the identified presentation and necessary registry
or verification artifacts; preserve unrelated presentations.

Every Step carries id, era, title, caption, Scene, and typed payload. Derive
numbers from array order. Share both Scene and groupKey for successive states of
the same diagram. Keep continuing nodes mounted with stable layoutId values;
only newcomer mounts use Appear, whose enter delay follows layout motion. Use
AnimatePresence for departures. Never put a step-index key on a grouped scene or
re-wrap continuing entities as newcomers. Preserve intentional overlapping or
stacked composition. Generic primitives accept class/data/style hooks; use raw
motion elements with stable layoutIds when a primitive is the wrong shape.

Compose in an 880 × 380 fixed canvas; scale uniformly rather than reflowing the
diagram. Use plain CSS owned by the presentation or host for the designed look
unless a framework is already present or explicitly requested. Keep visual
choices out of the reusable kit. Style semantic `[data-presentation-active="true"]`
progress and ToC states distinctly. Make `[data-presentation-attribution] a`
legible and intentional (at least 12px, deliberate color and link treatment).
The default bottom-right attribution reads “made by and-scene”; top-left branding
is opt-in through the host's brand prop.

## 4. Verify and repair before reporting success

Run `npm run build` over the whole app. Run the project-local verification driver
for the generated/modified slug: `npm run verify -- --slug <slug> --first` is the
minimum first-step render check; prefer `npm run verify -- --slug <slug>` for all
steps. In this repository, bare `npm run verify` additionally enforces the
canonical reference outline. Use production preview on 127.0.0.1 consistently.
Do not report success on type/build errors, console errors, page errors, missing
routes, or failed transitions. Fix the fault and rerun its check.

Run `npm run inspect -- <slug>` when the project-local helper exists. Prefer it
over ad hoc scripts so dependencies resolve locally and screenshots are settled.
If no helper exists, any temporary Playwright helper must live under the project
root. Inspect settled screenshots or equivalent browser views for the **first,
last, and dense/key steps**, plus a **narrow viewport** when responsive-sensitive
(`npm run inspect -- <slug> --width 390 --height 844`). In environments providing
chrome-devtools-axi, use it for interactive browser inspection, beginning with a
snapshot. Never substitute screenshots for the deterministic verification gate.

Review all overlap and chrome-polish warnings at their cited steps. Check that
important content fits the fixed canvas, intentional overlaps remain readable,
and text does not collide with captions, progress, ToC, or controls. Fix accidental
collisions, indistinct current-step chrome, and unpolished attribution. Only for
intentional readable overlap add `data-presentation-allow-overlap` to the smallest
appropriate subtree; do not blanket-exempt a scene to suppress warnings. Re-run
inspection and review the affected views. Warnings are advisory artifacts, not a
subjective automated pass/fail score; explain any deliberate remaining warnings.

Before success, confirm per-step captions, next/previous navigation, stable-entity
scene continuity, clean build, clean route render, and coherent visual composition.
Report the changed presentation and route, checks run, and any remaining advisory
status accurately. Repair failures yourself and recheck before declaring success.

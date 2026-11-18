---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with a reusable React scene kit and production verification.
---

# Presentation

Use this hybrid skill for a new presentation or a scoped edit. A presentation is
an ordered story over stable entities, not a collection of disconnected slides.
The entry component's conventional filename is `Talk.tsx`; it is still a presentation.

## Gather the story

For creation, capture the topic, visual direction, and each step's title,
paragraph caption, and visual description. Ask for missing information **one
question at a time**, starting with topic, then style, then the narrative beats.
Do not invent information the user can still provide. If all details are already
provided, proceed without repeating questions. Let the user choose their depth:
if they explicitly want to build with partial detail, use what was captured and
iterate; there is no hard completeness gate. For a key or complex composition,
you may show an ASCII mockup to clarify layout; this is optional, not a ritual
for every step. Identify persisting, entering, and departing entities between beats.

For modification, identify the target first. If unspecified or ambiguous, list
the registered presentations and ask which one before changing anything. Once
identified, ask only about the requested changes to steps, entities, or style.
Do not restart the full creation interview. Preserve all unrelated presentations.

## Resolve infrastructure and destination

Locate this installed `SKILL.md` first. Resolve `templates/bootstrap/` and
`templates/presentation/` relative to **this file's directory**, never relative
to the user's current working directory. The adjacent executable resolver can
also be called from any working directory: `node <absolute-skill-directory>/templates.mjs bootstrap`
(or `presentation`). It prints the asset path relative to its own installed
location. Use that resolved path when copying templates. The snapshot is distributable; it does
not require the authoring repository to be present.

Inspect contracts, not exact filenames, formatting, or template equality:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A scene kit with typed Step/Scene payloads, active scene host, stable entity
   morphs, navigation/modes, chrome, and fit scaling.
3. A presentation registry mapping each presentation to its own route.

All present: reuse the app and skip scaffolding, even if cosmetics differ. Some
present: retain them and add **only missing anchors** and required dependencies.
None present: create the complete scaffold. Do not overwrite unrelated files or
working anchors. Integrate scripts/configuration and registry entries by merging,
not replacing whole existing files.

An already identified presentation app is the destination. Otherwise detect a
monorepo by package.json `workspaces`, `pnpm-workspace.yaml`, or a `packages/` or
`apps/` layout. In a monorepo use a self-contained `presentations/` app, preserving
the root build and unrelated contents. Empty and standalone projects use the
project root. If a non-empty project lacks the kit or index, state the exact
target location and **wait for the user's confirmation before writing**.

Copy the missing bootstrap assets from this skill's `templates/bootstrap/`.
The bootstrap includes an unstyled `starter` route to prove integration. Keep it
until the new route works; removing this disposable starter is optional, while
user-owned presentations must remain intact. The bootstrap's `npm run verify`
uses `--registered` to verify every registered presentation, including new user
presentations, so it continues to work after removing the starter. Ensure all dependencies, even if
none were initially installed:

- Runtime: react, react-dom, motion, lucide-react.
- Build/dev: vite, @vitejs/plugin-react, typescript, @types/react,
  @types/react-dom, @types/node, eslint, @eslint/js, typescript-eslint,
  eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, playwright.
- The bootstrap also supplies Vitest, jsdom, and Testing Library for fast tests.

Use the supplied package and lock together for a fresh scaffold (`npm ci`). For
an existing app merge missing dependencies/scripts and run `npm install` to
update its own lock; never replace its dependency declarations wholesale. Install
Chromium with `npx playwright install chromium` if unavailable. Do not assume any
of these dependencies were present. Keep `npm test` fast; put real filesystem,
subprocess, and browser tests in a separate script.

The bootstrap has no presentation theme, default palette, fonts, spacing scale,
borders, cards, buttons, shadows, or CSS tokens. Do not add Tailwind, a Tailwind
Vite plugin, or another framework unless the host already uses it or the user
explicitly requests it. Plain presentation-local CSS is the default.

## Generate or edit

Use the presentation templates as structural examples. Create
`src/presentations/<slug>/entities.ts`, `steps/`, `Talk.tsx`, and local CSS.
Replace template names, metadata, IDs, and payloads with the captured story.
Keep IDs stable and namespaced per presentation. Use one Scene and groupKey for
successive states of the same diagram; pass a typed payload through Presentation
without casts. Continuing entities must remain keyed and must not acquire an
Appear wrapper on every update. Node entry timing waits for layout motion;
wrap only true newcomers if using Appear. Use AnimatePresence for disappearing
entities so exits run. Stable `layoutId`s also work on raw motion elements when
primitives do not fit a coordinate-heavy shape. Preserve intentional readable
stacking rather than spreading a diagram to fit an implementation pattern.

Add one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` registry
entry, retaining existing entries. Check the landing link and route. Keep
numbers derived from order, not manually assigned. Every step needs an era,
one-line title, paragraph caption, and diagram state. Existing routes must
remain reachable after creation or modification.

The kit owns geometry and behavior only. Style the presentation's root class and
its stable `data-presentation-*` hooks in presentation- or host-owned files.
Style `[data-presentation-active="true"]` distinctly from inactive progress and
ToC controls. Style `[data-presentation-attribution] a` for legible intentional
attribution. Default disclosure is bottom-right “made by and-scene” linking to
https://github.com/Codagent-AI/and-scene; top-left branding is host opt-in.
Never put theme defaults into the reusable kit. Respect the fixed 880×380 canvas:
composition scales uniformly, without internal responsive reflow. Browse shows
captions and navigation; present shows the current marker and one-line title.

Design for readable **displayed** type, not just design-space font sizes. Budget
for a narrow portrait viewport as well as desktop. With the default 880×380
canvas and 20px side reservations, a 320px-wide viewport fits at 280/880 ≈ 0.318:
a 12px displayed label needs at least 38px in design space (at 390px, it displays
at about 15px). Use `minimum displayed font size / minimum fit scale` to size
presentation-owned typography, then size shapes to contain it. Keep labels short,
use recognizable symbols with full accessible descriptions where useful, and put
long narration in the existing captions. Preserve one fixed arrangement at every
viewport; keep persisting entities stationary in an accumulating scene. Enlarging
type without enlarging its containers is not sufficient. The worked reference
shows vertically stacked title/caption/visual fields inside large step cards.
Do not add font defaults to the kit or style-neutral bootstrap to achieve this.

## Verify and repair before completion

Run `npm run build`, then the local production render check for the generated or
modified route: `node scripts/verify.mjs --route <slug> --first`. This must render
at least the first step without runtime or console errors. Before completion run
`npm run verify` in a scaffolded app to traverse every registered presentation,
and `node scripts/verify.mjs --route <slug>` for a focused route check. The authoring
repository's default `npm run verify` additionally enforces its canonical sample.
The server, readiness probe, and browser URLs must all use `127.0.0.1`.

A successful render is not a visual-composition check. Prefer the project-local
`npm run inspect -- <slug>` helper, which builds, starts a production preview,
waits for transitions, and captures every settled step under
`artifacts/inspection/<slug>/<width>x<height>/`. Set `--settle` above the longest
custom animation when necessary. Use `--width 390 --height 844` for a narrow
capture of a responsive-sensitive presentation. If the local helper is absent,
create any temporary Playwright helper **inside the project root**, so local
browser dependencies resolve. Do not put ad hoc helpers outside the project.

Review first, last, dense, and key/transition-critical screenshots or equivalent
browser views; also check a narrow viewport when responsive-sensitive. For
interactive inspection use AXI when installed: begin with a structure snapshot,
then screenshots. Confirm important content fits the fixed canvas, intentional
overlaps remain readable, and captions, ToC, progress, and navigation do not
collide with the scene. Review every step named in advisory diagnostics. Fix
accidental overlaps, small scene text after fit scaling, indistinct active
navigation, and missing/default/undersized attribution locally. The helper warns
when visible scene text displays below 12px; review those labels at normal zoom
and repair the presentation-owned type and shape geometry before completion. Only an intentionally readable overlap may be exempted with
`data-presentation-allow-overlap` on its smallest appropriate subtree; do not
blanket-exempt the scene or chrome to silence warnings.

If build, render, or composition checks fail, fix the fault and rerun the
relevant checks before reporting success. Warnings are advisory review aids,
not an automated visual pass/fail score. Report the route, checks run, artifacts,
and any reviewed remaining advisory status accurately. Do not claim completion
with a failed build/render or unresolved composition failure. Never commit
node_modules, dist, or inspection screenshots. No publishing or export workflow
is part of this skill.

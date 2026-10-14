---
name: presentation
description: Create or modify browser presentations as evolving diagrammatic scenes; gather narrative and visual requirements, bootstrap a React scene app when needed, and verify its behavior and composition.
---

# Presentation

Build one scene through named states, preserving entities as the story develops.
Use the four phases below. Templates are relative to the directory containing
**this SKILL.md**, never the user's current working directory:
[bootstrap](templates/bootstrap/) and [presentation](templates/presentation/).
Read the supplied [scene-kit contract](templates/bootstrap/src/presentation-kit/README.md)
before authoring scenes.

## 1. Gather

Ask one question at a time for missing topic, visual style, and each step's
content plus visual description. Do not invent details the user can still
provide. The user controls depth: accept an explicit choice to build with
partial detail and iterate; there is no completeness gate. Skip questions when
the prompt already provides these details. Optional ASCII mockups can confirm
key or complex compositions; they are unnecessary for every step.

For a modification, identify the presentation first. If unspecified or ambiguous,
list existing presentations and ask which to modify. Then ask only about the
requested changes, without repeating the full creation interview.

## 2. Resolve target and scaffold missing infrastructure

Inspect the project for three **contract anchors**, not byte equality or specific
filenames. Cosmetic differences and extra dependencies do not require replacement:

- Build: Vite + React + TypeScript with a working `npm run build`.
- Scene kit: typed `Step`/`Scene`, active-step host and entity morphs, present/browse
  navigation, captions/ToC chrome, and fixed-canvas fit scaling.
- Presentation index: explicit registry mapping multiple presentations to routes.

Already inside a presentation app: use it and add only missing anchors. Otherwise,
an empty directory or standalone project targets its root. Detect monorepos via
`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/`
layout; target a self-contained `presentations/` app there, preserving the root
build and unrelated content. In a non-empty project missing the kit or index,
state the resolved target and wait for confirmation before writing. Respect
explicit target authorization already supplied by the user.

For a fresh app copy the entire bootstrap, including dotfiles and committed
`package-lock.json`. For partial scaffolds merge only missing anchors and their
dependencies; preserve existing configuration and presentations. Adapt imports
and routing to existing contracts rather than overwriting a working host.
Ensure the complete dependency set declared in the bootstrap package:
`react`, `react-dom`, `motion`, `lucide-react`; `vite`, `@vitejs/plugin-react`,
`typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `eslint`,
`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`,
`eslint-plugin-react-refresh`, `globals`, and `playwright`. Never assume these
are installed. Run `npm ci` for the intact fresh lock; use `npm install` after
merging dependencies into an existing package. Make Chromium available with
`npx playwright install chromium` (system dependencies may need `--with-deps`).
Keep `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`, `verify`, and
`inspect` scripts working. The empty scaffold can verify its landing page;
register a presentation before claiming presentation render verification.

The scaffold and kit supply no visual theme or required styling framework.
Plain CSS is the default; add Tailwind or another system only if the host
already uses it or the user requests it.

## 3. Generate or modify

Copy the presentation template into `src/presentations/<slug>/`. Replace its
neutral example with captured content; change the entity namespace and root
CSS class to the unique slug. Each folder owns `entities.ts`, `steps/*.tsx`,
`Talk.tsx`, and plain `style.css`. Add one explicit `{ slug, title, load }` entry
in `src/presentations/index.ts`, using `load: () => import('./<slug>/Talk')`.
Check that the landing link reaches `/<slug>`; keep existing presentations intact.
For modifications edit the identified presentation in place and preserve scope.

Every `Step<TPayload>` has stable `id`, `era`, one-line `title`, paragraph
`caption`, `Scene`, and typed `payload`; numbering follows array order. Adjacent
steps with the same `groupKey` and `Scene` persist without remounting. Assign
stable presentation-namespaced `layoutId`s to continuing entities; morph their
positions, size, label, or emphasis. Wrap only newcomers in `Appear` inside
scene-owned `AnimatePresence`, so entry follows continuing motion and departures
exit. Do not fade continuing entities as newcomers. Compose in the 880 × 380
fixed canvas using `SceneLayer`, kit nodes, or raw Motion elements with stable
identities; fit scaling preserves composition across viewport sizes.

Presentations own palette, typography, spacing, borders, shadows, node/control
treatments, visibly distinct active chrome, and legible attribution. Keep those
choices in presentation-owned or host-owned CSS, scoped to the presentation's
class. The kit owns behavior and geometry with zero visual defaults. Style via
these stable hooks (see the kit contract for navigation and modes):

- `data-step-count`, `data-step-index`, `data-presentation-chrome`,
  `data-presentation-mode`, `data-presentation-stage`.
- `data-presentation-title`, `data-presentation-caption`,
  `data-presentation-marker`, `data-presentation-era`.
- `data-presentation-progress`, `data-presentation-progress-item`,
  `data-presentation-toc`, `data-presentation-toc-item`,
  `data-presentation-prev`, `data-presentation-next`.
- `data-presentation-active="true"` with `aria-current` identifies current
  progress/ToC controls. Give them a visible local treatment.
- `data-presentation-attribution` styles the bottom-right link;
  `data-presentation-brand` is host opt-in; `data-presentation-link` identifies
  registered landing links.
- `data-presentation-allow-overlap` exempts only an intentionally overlapping,
  readable subtree from visual diagnostics.

## 4. Self-verify before completion

Run `npm run build` and render at least the first step without runtime or console
errors. Check captions, next/previous controls, and entity continuity. You may
start with this lighter check, but finish with `npm run verify`, which builds the
whole app and renders every registered presentation through every step.
Use `127.0.0.1` for preview, readiness probes, and browser routes.

Run the project-local `npm run inspect -- <slug> --build` helper. Review settled
screenshots of first, last, and dense/key steps; also run
`npm run inspect -- <slug> --viewport 390x844` when responsive-sensitive. Prefer
`chrome-devtools-axi` when available: open the route, start with `snapshot`, then
capture screenshots and inspect composition. Important content must fit the
canvas, intentional overlaps must stay readable, and scenes must avoid caption,
progress, ToC, and navigation collisions. Review every advisory warning: fix
accidental collisions, indistinct active controls, and unpolished attribution
with local CSS; mark only readable intentional overlaps. Rerun inspection after
fixes. Warnings are advisory, not evidence of visual success by themselves.
If the helper is unavailable, write any temporary Playwright helper **under the
project root** so dependencies resolve locally. Ignore `.inspection/`, generated
build output, and dependency directories; do not commit screenshots or add CI.

Never report success while build, render, or composition checks fail. Fix and
recheck. Report the route, changes, verification outcome, visual evidence, and
any remaining advisory limitations accurately.

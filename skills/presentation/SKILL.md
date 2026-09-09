---
name: presentation
description: Create or modify a browser-based presentation made from one evolving React scene. Use for presentation, talk, deck, slide-like, or visual narrative requests.
---

# Evolving-scene presentations

Create browser presentations as a single diagrammatic scene that changes through
ordered, named steps. Do not make unrelated slide pages. Stable entities keep
stable `layoutId` values, grouped steps reuse one `Scene`, and each presentation
owns its visual design outside `src/presentation-kit/`.

## Locate this skill's resources

Resolve every template relative to this file, never relative to the caller's
working directory:

```text
SKILL_DIR = directory containing this SKILL.md
BOOTSTRAP = SKILL_DIR/templates/bootstrap
PRESENTATION_TEMPLATE = SKILL_DIR/templates/presentation
STEP_TEMPLATE = SKILL_DIR/templates/step
```

The bootstrap's `src/presentation-kit/` is a release snapshot. Keep it byte
aligned with the canonical app kit when updating either copy. Its code provides
behavior and stable `data-presentation-*` hooks, not a visual design system.

## 1. Gather, one question at a time

First classify the request as **create** or **modify**. Ask exactly one missing
question per message, in this order:

1. Ask for the topic if it was not supplied.
2. Ask for a visual direction (mood, palette, type, imagery, or an explicitly
   plain direction) if it was not supplied.
3. Ask for one step at a time: its era, presenter title, browse caption, and
   what appears, persists, moves, or exits in the scene. Continue until the
   user says the outline is complete.

Never invent an answer that the user can still provide. The user may explicitly
choose to proceed with partial detail; record the unknown details as deliberate
open design choices and build from the captured outline. If a key step has a
complex spatial relationship, show one compact ASCII mockup and ask whether it
matches before building; do not require mockups for ordinary steps. If the
initial request already includes the topic, style, and every step, build without
repeating the questions.

For **modify**, inspect the registry first. If no target is named or more than
one target matches, list the registered slugs/titles and ask one question to
identify it. Once selected, ask only about the requested step, entity, caption,
or local style change; do not re-run the create interview.

## 2. Resolve the app target and anchors

Inspect the proposed target for these contract anchors (names may differ):

1. **Build setup:** a Vite + React + TypeScript app where `npm run build` works.
2. **Scene kit:** a presentation-agnostic `Step`/`Scene` contract, active-step
   host with morphing, present/browse navigation and chrome, and fit-scaled
   canvas.
3. **Presentation index:** an explicit registry mapping independent presentation
   routes to lazy-loadable entry components.

Detect a monorepo from `workspaces` in `package.json`, `pnpm-workspace.yaml`, or
`packages/` or `apps/`. For an empty or standalone project, use its root. For a
monorepo, use a self-contained `presentations/` app. When a non-empty project is
missing any anchor, state the exact target and ask for confirmation before
writing. When all anchors are present, reuse them and do not scaffold.

When anchors are absent, copy only the missing infrastructure from `BOOTSTRAP`;
do not replace a working build setup, kit, registry, existing presentation, or
host styling. Merge the bootstrap dependency contract and install it — do not
assume dependencies exist:

```text
runtime: react, react-dom, motion, lucide-react
dev/build: vite, @vitejs/plugin-react, typescript, @types/react,
@types/react-dom, @types/node, eslint stack, playwright
```

Run the target's package install after merging (`npm install`, or `npm ci` when
the lockfile is authoritative), then make Chromium available with
`npx playwright install chromium` before the first browser check.

Use plain CSS by default. Do not add Tailwind, its Vite plugin, or another style
framework unless the host already uses it or the user explicitly requests it.
The kit must remain free of palette, typography, spacing, border, shadow, card,
button, or theme defaults; put all designed styling in the presentation folder
or host stylesheet. The bootstrap includes local `scripts/verify.mjs` and
`scripts/inspect-presentation.mjs`; retain them when scaffolding.

## 3. Create or modify the presentation

For a new presentation:

1. Derive a unique kebab-case slug and make `src/presentations/<slug>/`.
2. Copy `entities.ts.template`, `Talk.tsx.template`, `Scene.tsx.template`, and
   `presentation.css.template`, then replace their placeholders.
3. Add one typed `Step` per gathered beat. Every step needs a stable `id`, era,
   title, caption, `Scene`, and payload. Adjacent states of one diagram share a
   `groupKey`; entity ids in `entities.ts` are namespaced by slug and persist
   across every state in which the entity persists.
4. Compose scenes from `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
   `SymbolChip`, `Appear`, and `SceneLayer`, or raw motion elements with stable
   layout ids when appropriate. New entities use `Appear`; do not fade continuing
   entities as newcomers.
5. Design the scene in the fixed 880 × 380 canvas. Keep content clear of the
   header, caption, ToC, progress, and navigation. Apply local CSS to make active
   ToC/progress controls and `[data-presentation-attribution]` visibly distinct
   and legible. Mark only a genuinely intentional readable overlap with
   `data-allow-overlap`.
6. Add exactly one explicit registry entry in `src/presentations/index.ts`:
   `{ slug, title, load: () => import('./<slug>/Talk') }`.

For a modification, edit only the selected presentation and the minimum required
registry or host files. Preserve all other folders and registrations. Do not
redraw the whole scene merely to change one step.

## 4. Verify before reporting completion

Do not report success until every relevant check passes. From the app target:

1. Run `npm run build` and fix all type/build errors.
2. Run the project-local render command (`npm run verify -- <slug>` when
   available) and fix runtime, console, route, or transition failures. At a
   minimum it must render step one cleanly; run the full verifier when present.
3. Run `npm run inspect -- <slug>` when available. It captures settled browser
   screenshots under the project artifact directory. Inspect the first, last,
   and densest/key steps; inspect a narrow viewport too when responsiveness is
   relevant. If no helper exists, place a temporary Playwright helper under the
   project root, never outside it.
4. Review all visual warnings. Fix accidental text/chrome collisions, indistinct
   current-step chrome, and weak attribution. Do not suppress a warning except
   with a narrow `data-allow-overlap` marker for intentional readable overlap.
5. Re-run failed checks after each fix.

Completion reporting names the created/changed route, changed files, build and
render results, inspected steps/viewports, and any remaining advisory warnings.
Never describe a failed build, render, or visual check as success.

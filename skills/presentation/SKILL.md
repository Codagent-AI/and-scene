---
name: presentation
description: Creates and modifies browser-based evolving-scene presentations (React, Vite, Motion) with a reusable scene kit, per-presentation routes, and build/render/visual verification. Use when the user asks to "make a presentation", "create a deck", "build slides", "add a presentation", "modify my presentation", or "change a step" in an and-scene project.
---

# Presentation

Builds presentations modeled as one evolving diagram: stable entities move through named steps. Each presentation is its own folder and route, drawn with a shared, style-neutral scene kit.

**Skill directory** = the directory containing this `SKILL.md`. Resolve `templates/...` relative to it, never the working directory.

## Out of scope

This skill produces browser-based React presentations only. For PowerPoint, Keynote, PDF, image export, Google Slides, hosting, or a visual editor, say so and point the user to a suitable document or slide-generation workflow instead of building here.

## Procedure

Copy this checklist and complete it in order:

- [ ] 1. Route: create or modify
- [ ] 2. Gather details
- [ ] 3. Resolve target and scaffold what is missing
- [ ] 4. Generate or modify the presentation
- [ ] 5. Verify and fix
- [ ] 6. Report

### 1. Route

Modifying an existing presentation → go to **Modify** below after step 3's anchor detection. Otherwise create.

### 2. Gather details (create)

Ask **one question at a time**. Never assume what the user can still provide. Cover, in order:

1. Topic and audience.
2. Visual style (mood, palette, type, density).
3. Each step: title, caption, era (section label), and the scene content and visual intent — which entities appear, move, or connect.

Rules:
- Skip questions the prompt already answers; a complete prompt may go straight to building.
- The user may build with partial detail at any time ("just build it"). Do not block on completeness; fill gaps sensibly, say which you filled, and let them iterate.
- For a key or complex step, optionally draw an ASCII mockup and confirm the layout. Do not mock up every step.

### 3. Resolve target and scaffold

Detect three **contract anchors** by presence, not byte-identity (file naming, formatting, and extra dependencies do not trigger re-scaffolding):

| Anchor | Present when |
| --- | --- |
| Build setup | `package.json` with a working `npm run build` for a Vite + React + TypeScript app |
| Scene kit | a `presentation-kit/` directory exporting `Presentation`, `Step`/`SceneProps`, and the node primitives |
| Presentation index | `presentations/index.ts` exporting a `presentations` registry of `{ slug, title, load }` |

**Target location** — first match wins:
1. Current or an ancestor app already has the anchors → use that app; scaffold only what is missing.
2. Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/`/`apps/` layout) → a self-contained app in `presentations/`. Do not modify the monorepo root.
3. Empty or standalone project → the repository root.

If the project is non-empty and lacks the scene kit or the index, **state the target and wait for the user's confirmation** before writing. An empty directory needs no confirmation.

**Scaffold** only the missing anchors, never touching present ones. Copy from `<skill dir>/templates/bootstrap/`:
- Build setup: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `.gitignore`, `.npmrc`, `src/main.tsx`, `src/router.tsx`, `src/resolveRoute.ts`, `src/Landing.tsx`, `src/index.css`, `scripts/`.
- Scene kit: `src/presentation-kit/`.
- Presentation index: `src/presentations/index.ts`.

For a partially scaffolded project, merge dependencies into the existing `package.json` instead of overwriting it. Never assume dependencies are installed. Ensure: `react`, `react-dom`, `motion`, `lucide-react`, `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack, and `playwright`. Install them (`npm ci` from the template lockfile for a full scaffold, else `npm install`), then `npx playwright install chromium` if Chromium is unavailable.

**No style framework.** Do not add Tailwind or any styling framework unless the host already uses it or the user asks. The kit and scaffold define no colors, fonts, spacing, borders, shadows, card or button styles, or theme tokens. Do not add any to the kit.

### 4. Generate a presentation

Use `<skill dir>/templates/presentation/` and `templates/step/`. Replace `__SLUG__` and `__TITLE__` (also in file names). Produce a self-contained folder `src/presentations/<slug>/`:

- `entities.ts` — the presentation's stable `layoutId` namespace, one id per entity.
- `steps/*.tsx` + `steps/index.ts` — one Scene per step composing kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`).
- `Talk.tsx` — `<Presentation steps title initialMode />`.
- `<slug>.css` — **plain CSS owns the visual design** (palette, type, spacing, borders, control looks) unless the host already uses a styling framework or the user asked for one. Never put styling in the kit.

Then register with one line in `src/presentations/index.ts`, keeping existing entries: `{ slug, title, load: () => import('./<slug>/Talk') }`. Existing presentations must stay intact and reachable.

Evolving-scene rules:
- Entities keep the same id across steps; reused ids morph, they are not redrawn. Persisting entities render without `<Appear>`; only newcomers use it.
- Use `groupKey` to keep one scene instance across steps that only change payload.
- Design for the fixed 880 × 380 canvas; keep content inside it and clear of chrome.
- Every step has a caption and an era. Do not override kit hooks (`data-presentation-*`, `data-step-count`, `data-step-index`).
- Style the active progress/table-of-contents state (`[data-presentation-active='true']`) so it is visibly distinct, and style the attribution (`.presentation-attribution`) so it is legible. Do this in presentation or host CSS.
- Mark an intentional, readable overlap with `data-presentation-allow-overlap` on its subtree. Use it only for deliberate composition.

### Modify (existing presentation)

1. Identify the target. If it is missing or ambiguous, list the registered presentations and ask which one before changing anything.
2. Read the target before editing: its `Talk.tsx`, `entities.ts`, `steps/index.ts`, the scenes you will touch, its CSS, and its registry line. Match the entity-id namespace, import style, and styling approach you find.
3. Ask only about the requested changes (steps, entities, or style). Do not re-run the create interview.
4. Edit only that presentation's folder (and its registry line when the slug or title changes). Leave other presentations untouched.
5. Continue at step 5.

### 5. Verify and fix

Do not report success until all pass. On any failure, fix the cause and re-run:

1. `npm run build` — no type or build errors.
2. `npm run verify` — builds, then renders every step of each registered presentation in Chromium on `127.0.0.1`, failing on console or page errors.
3. Visual composition — `npm run inspect -- <slug>` writes settled screenshots to `.inspection/<slug>/step-NN.png` and prints advisory warnings. Prefer this project-local helper over ad hoc scripts; if it is unavailable, write any temporary Playwright script under the project root. View the first step, the last step, and every dense or key step. If the presentation is responsive-sensitive, also run `npm run inspect -- <slug> --viewport 390x844`.
4. Confirm that important content fits the canvas, intentional overlaps stay readable, and nothing collides with captions, progress, the table of contents, or navigation.
5. Review every warning: fix accidental collisions and indistinct active chrome or attribution; add `data-presentation-allow-overlap` only to intentional readable overlaps.

Do not commit `.inspection/`, `dist/`, or `node_modules/`.

### 6. Report

State the presentation's route, the files created or changed, whether scaffolding ran and where, and which checks passed. Report any check that could not run; do not imply success.

---
name: presentation
description: Create or modify a presentation as one evolving diagrammatic scene (React + Vite + Motion), with an interactive interview, self-bootstrapping scaffold, and build/render/visual self-verification. Use when the user asks to make, build, create, edit, update, or change a presentation, talk, deck, slides, or an animated step-by-step explainer.
---

# Presentation

Build a presentation as **one scene that evolves through named steps** — entities appear, move, connect, and re-label — not a stack of unrelated slides. Each presentation is its own folder with its own route; a reusable, style-neutral scene kit supplies motion, canvas fit, navigation, and chrome. Presentations own all styling.

All template paths below are resolved **relative to the directory containing this `SKILL.md`** (`<skill-dir>`), never relative to the caller's current working directory. Locate this file first and derive `<skill-dir>/templates/bootstrap/` and `<skill-dir>/templates/presentation/` from it.

## 1. Gather

Ask the user clarifying questions **one at a time** (never a batch). Cover, in order:

1. The topic (and audience/length if useful).
2. The visual style.
3. For each step: its content (title, caption) and its visual description (what appears, moves, or changes).

Rules:
- Do not assume details the user can still supply. If the prompt already contains topic, style, and all step details, proceed without further questions.
- The user controls depth. If they choose to build with partial detail, build from what was captured and iterate; do not block on completeness.
- For key or complex steps only, you may draw an ASCII mockup to confirm layout before building. Do not mock up every step.

For a **modification** request, skip the full interview: identify the target (section 3) and ask only about the requested changes (steps, entities, or style).

## 2. Resolve target and scaffold

Detect the three **contract anchors** at contract level (presence of the capability, not a byte-identical scaffold; cosmetic differences, file naming, or extra dependencies do not trigger re-scaffolding):

1. **Build setup** — a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit** — the presentation-agnostic engine (`Step`/`Scene` contract, stage/host, present/browse navigation, chrome, fit-scale canvas), conventionally `src/presentation-kit/`.
3. **Presentation index** — the registry mapping each presentation to its own route, conventionally `src/presentations/index.ts`.

Resolve the target location:
- **Empty directory or standalone (non-monorepo) project** → scaffold at the repository root.
- **Monorepo** — any of: `workspaces` in `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout → scaffold a self-contained app under `presentations/` (do not mutate the monorepo root).
- **Already inside a presentation app** (anchors present) → reuse it and scaffold only the missing anchors.

Then:
- **All anchors present** → skip scaffolding.
- **Some missing** → copy only the missing anchors (and their dependencies) from `<skill-dir>/templates/bootstrap/`, without overwriting or disturbing the present ones.
- **None present** → copy the whole `templates/bootstrap/` snapshot (never copy `node_modules`).
- In any **non-empty project**, state the target location you will scaffold into and **get the user's confirmation before writing** anything.
- **Never assume dependencies are installed.** Install the full set: runtime `react`, `react-dom`, `motion`, `lucide-react`; dev `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack, and `playwright`. Prefer `npm ci` from the template lockfile for a fresh scaffold; use `npm install` when merging into an existing project. Then install the browser: `npx playwright install chromium`.
- The scaffold is style-neutral: no Tailwind, no default theme, colors, fonts, or card/button styles. Add Tailwind or another framework only if the host already uses it or the user explicitly asks — and never inside the kit.

## 3. Generate or modify

### New presentation

Pick a kebab-case `<slug>`. Copy `<skill-dir>/templates/presentation/` into `src/presentations/<slug>/` (replace `__SLUG__` and `__TITLE__`; rename `__SLUG__.css` to `<slug>.css`) and fill it in:

- `entities.ts` — stable `layoutId` namespace for the deck's entities.
- `steps/*.tsx` + `steps/index.ts` — one `Step` per file (`id`, `era`, `title`, `caption`, `Scene`, optional `groupKey` + `payload`).
- `Scene.tsx` / `types.ts` — the shared scene component and payload when steps share a scene.
- `Talk.tsx` — default export rendering `<Presentation steps title initialMode />`; imports the local CSS.
- `<slug>.css` — **plain CSS** owned by the presentation. Styling lives only in presentation-owned or host-owned files, never in the kit.

Register it with one explicit line in `src/presentations/index.ts` (pattern in `templates/presentation/registry-entry.txt`):

```ts
{ slug: 'my-talk', title: 'My Talk', load: () => import('./my-talk/Talk') },
```

Existing presentations stay untouched and reachable. Every step needs a caption; navigation is next/previous.

### Modify an existing presentation

If the target is unspecified or ambiguous, **list the existing presentations** (from the registry) and ask which to modify before changing anything. Then ask only about the requested changes and edit that presentation in place; do not re-walk the create flow.

### Kit hook vocabulary

The kit exposes stable hooks for your CSS:
- Chrome root: `data-step-count` (total steps), `data-step-index` (zero-based active index), `data-presentation-mode="present"|"browse"`.
- `data-presentation-progress-item` (progress indicators) and `data-presentation-toc-item` (table-of-contents entries). The one for the active step also carries `aria-current="step"` and `data-presentation-active="true"`.
- `data-presentation-attribution`: the `made by and-scene` link, bottom-right.
- `data-presentation-allow-overlap`: on a subtree root, suppresses text/chrome overlap warnings for elements inside it.

Style the **active** progress/TOC state so it is visibly distinct from inactive items (target `[data-presentation-active="true"]` / `[aria-current="step"]`), and make the **attribution** legible (size, color, contrast on your background) via `[data-presentation-attribution]`.

**Grouped scenes:** adjacent steps sharing the same `groupKey` and `Scene` keep one scene instance and only `payload` changes, so shared `layoutId`s morph; other steps cross-fade.

**Intentional overlaps:** mark a deliberate, readable overlap (e.g. a frame around the whole scene, a plug sitting on a socket) by wrapping it in an element with `data-presentation-allow-overlap`. Never use it to silence an accidental collision — fix those.

## 4. Self-verify

Before reporting success, from the app root:

1. `npm run build` — must be free of type errors.
2. Render check: `npm run verify -- --slug <slug>` (the generated or modified slug, so the check targets what you just produced and not only any reference sample). The first step must render without runtime or console errors. A lighter single-route check may run first; run the full `npm run verify` before completion.
3. Visual inspection with the **project-local helper**: `npm run inspect -- <slug>` (prefer it over ad hoc scripts; any temporary Playwright helper must live under the project root so it resolves local dependencies). Review the screenshots for the **first step, the last step, and dense/key steps**; for responsive-sensitive presentations also run with `--viewport 390x844`.
4. Review the helper's advisory warnings (`overlap`, `active-chrome`, `attribution`). Fix accidental collisions, indistinct active chrome, and attribution polish; mark only genuinely intentional readable overlaps with `data-presentation-allow-overlap`; rerun.

If the build, render, or visual checks fail, fix the problem and re-check. **Never report success while any check fails.** In the final report, state accurately which checks passed and any remaining advisory warnings.

---
name: presentation
description: Create or modify an animated, evolving-scene presentation (one diagram that morphs through named steps) in a Vite + React + TypeScript app. Gathers requirements one question at a time, scaffolds the app and scene kit if missing, generates the presentation, and verifies it builds, renders every step, and looks right in a browser. Use when the user asks for a presentation, talk, deck, or slides, or to change an existing one.
---

# Presentation skill

You build **evolving-scene presentations**: not a stack of slides, but one diagrammatic scene that changes through named steps. Entities appear, move, connect, and re-label; they are not redrawn. Each presentation is a self-contained folder reachable at its own route, built on a reusable, **style-neutral** scene kit.

**Template paths.** Everything under `templates/` is resolved relative to the directory that contains *this* `SKILL.md` — never relative to your current working directory. Below, `<skill>` means that directory (for example `<skill>/templates/bootstrap/`). Work out its absolute path before copying anything.

Do the phases in order: **1 Gather → 2 Resolve target + scaffold → 3 Generate or modify → 4 Self-verify**. Honor the evolving-scene rules (section 5) and the quality bar (section 6).

## 1. Gather

Ask the user clarifying questions **one at a time**, never as a batch. Cover, in this order, only what is missing:

1. the **topic** (and audience, if it changes the content),
2. the **visual style** (mood, palette, typography; the user may say "your call"),
3. for **each step**: its title/caption content and a description of what is on screen and what changes from the previous step.

Rules:

- Do not invent details the user can still give. Ask instead.
- If the prompt already contains the topic, style, and every step, skip questions and build.
- The user controls depth. If they say to build with partial detail ("just sketch it", "build with what we have"), do so immediately — there is no completeness gate. Fill gaps with sensible, clearly modest choices and tell them what you assumed so they can iterate.
- For a key or visually complex step you may draw an ASCII mockup and ask the user to confirm the layout before building. Do this selectively, not for every step.

**Modify requests.** If asked to change an existing presentation and the target is unspecified or ambiguous, list the presentations in `src/presentations/index.ts` (slug and title) and ask which one **before changing anything**. Once the target is known, ask only about the requested changes (steps, entities, or style) and edit that presentation in place. Do not re-walk the create flow. Then go to phase 4.

## 2. Resolve target and scaffold

A presentation depends on three **contract anchors**. Detect each by what it does, not by byte equality with the templates — renamed files, formatting, and extra dependencies must not trigger re-scaffolding.

| Anchor | Present when |
| --- | --- |
| **Build setup** | A Vite + React + TypeScript app whose `npm run build` works |
| **Scene kit** | A presentation-agnostic engine providing the `Step`/`Scene` step contract, a stage/host that mounts the active step and runs entity morphs, present/browse navigation, chrome (captions, table of contents) and a fit-scale canvas (canonical: `src/presentation-kit/`) |
| **Presentation index** | A registry mapping each presentation to its own route so several coexist (canonical: `src/presentations/index.ts` plus the router in `src/main.tsx`) |

### Target resolution

- Empty directory or standalone (non-monorepo) project → the app lives at the **project root**.
- Monorepo — `workspaces` in `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout → a **self-contained app in `presentations/`** (own `package.json`, lockfile, scripts), not the repo root.
- Already inside a presentation app (the anchors are found at or above the working directory, e.g. inside `presentations/`) → use that app; scaffold only what is missing.

### Scaffold decision

- **All three anchors present** → skip scaffolding; go to phase 3.
- **None present** (empty or unscaffolded) → full scaffold: copy `<skill>/templates/bootstrap/` into the target (it includes `package.json` + `package-lock.json`, Vite/TS/ESLint config, `src/main.tsx`, `src/Landing.tsx`, `src/presentation-kit/`, `src/presentations/index.ts` with a registered `starter` presentation, and `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, `scripts/verification.config.json`).
- **Partial** → add only the missing anchors, and the dependencies they need, without touching what exists. Merge dependencies into the existing `package.json` rather than replacing it; do not overwrite existing files.
- **Non-empty project that is missing the scene kit or the presentation index** → **state the target directory you will scaffold into and wait for the user's confirmation** before writing anything. (An empty directory needs no confirmation.)

Once the new app has your first presentation registered, remove the placeholder `starter` entry (registry line, folder, and `verification.config.json` entry) unless the user wants it.

### Dependencies and browser

Never assume dependencies are installed. In the app directory run `npm ci` (when a lockfile came from the template) or `npm install`, so the full set is present: runtime `react`, `react-dom`, `motion`, `lucide-react`; dev `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack, and `playwright`. Then ensure Chromium for Playwright: `npx playwright install chromium`.

### Styling stays out of the scaffold

The scaffold is styling-framework-neutral: no Tailwind, no Tailwind Vite plugin, no theme tokens, no default colors, fonts, cards, or buttons. Do not add any of these to the scene kit or to `src/index.css`. Presentations own their look. Add a framework only if the host project already uses one or the user explicitly asks.

## 3. Generate or modify

### Create a presentation

Pick a kebab-case slug. Using `<skill>/templates/presentation/` as the pattern (and the committed `how-to-make-a-presentation` sample if present), write in the new folder `src/presentations/<slug>/`:

- `entities.ts` — stable entity ids (the `layoutId` namespace),
- `steps/Scene.tsx`, `steps/NN-*.tsx` (one `Step` each), `steps/index.ts` exporting `STEPS`,
- `Talk.tsx` — renders `<Presentation steps={STEPS} title="…" initialMode="browse" />`,
- `talk.css` — **plain CSS** owned by this presentation (unless the host already uses a styling framework or the user asked for one), styled through the `data-presentation-*` hooks.

Then register it in two places — both are required:

1. **One new line** in `src/presentations/index.ts`: `{ slug: '<slug>', title: '<Title>', load: () => import('./<slug>/Talk') },` (see `registry-line.txt`).
2. **Append** `{ "slug": "<slug>" }` to the `presentations` array of `scripts/verification.config.json`, preserving existing entries (see `verification-entry.json`). Without this, `npm run verify` would check only other presentations. Add `expectedSteps` (`{title, caption}[]`) only if the user wants titles/captions asserted in order.

Preserve every existing presentation — never edit or delete their folders or registry lines. Style belongs in presentation or host files, never in `src/presentation-kit/`.

### Modify a presentation

Edit that presentation's folder in place. Keep `entities.ts` ids stable so existing morphs survive. If steps are added, removed, or retitled, update `expectedSteps` in the verification config if that entry has one.

## 4. Self-verify before reporting done

Never report success over broken output. Fix failures and re-check.

1. `npm run build` — must complete with no type errors. (While iterating you may use build plus a first-step render check; reserve the full run for completion.)
2. `npm run verify` — builds, serves a production preview on `127.0.0.1`, and renders every step of each configured presentation, failing on any console or page error. Confirm the target slug is in `scripts/verification.config.json` **and** appears in the output (`render: ok <slug> (N steps …)`). Use `npm run verify -- --slug <slug>` to focus one.
3. `npm run inspect -- <slug>` — the project-local screenshot helper. Prefer it over ad hoc scripts; screenshots land in `.inspection/<slug>/step-NN.png` after animations settle. If the helper is absent, any temporary Playwright script must live under the project root so it resolves local dependencies.
4. **Look at the screenshots**: the first step, the last step, and the dense or key steps. For responsive-sensitive presentations also run `npm run inspect -- <slug> --viewport 390x844` and look at those. Check that important content fits the fixed canvas, overlaps are readable, and nothing collides with the caption, progress indicator, table of contents, or navigation controls.
5. **Review every advisory warning** the helper prints (text/chrome overlap, indistinct active navigation, unpolished attribution). Fix accidental collisions; style the active ToC/progress item and the attribution in the presentation's CSS; mark only genuinely intentional, readable overlaps with `data-presentation-allow-overlap`. Rerun, and report any remaining advisory status accurately.

## 5. Evolving-scene rules

- **One scene.** Consecutive steps that share a scene use the same `scene` component and the same `groupKey`, so a single instance stays mounted and only `payload` changes.
- **Stable identity.** Every recurring entity has a stable id used as its `layoutId` (via `Box`, `Arrow`, etc. `id`), so it morphs between steps instead of being redrawn.
- **Accumulate.** Earlier entities stay on screen; later steps add to them. Do not rebuild the diagram per step.
- **Newcomers via `Appear`.** New entities enter wrapped in `Appear` (inside `AnimatePresence`), positioned in absolute layers (`SceneLayer`) so mounting one never reflows another.
- **Intentional overlap** (frames, sockets, labels on shapes) is preserved and marked `data-presentation-allow-overlap`; accidental collisions are fixed.
- **Hooks to style**: `data-presentation-chrome`, `-header`, `-footer`, `-era`, `-title`, `-caption`, `-marker`, `-prev`, `-next`, `-progress`, `-progress-item`, `-toc`, `-toc-entry`, `-attribution`, `-entity`, `-node`, and the step-count hooks `data-step-count` / `data-step-index`. The active item carries `aria-current="step"` and `data-presentation-active="true"`.
- Presentation-owned CSS must make the **active ToC/progress item visibly distinct** and the **attribution legible** (`[data-presentation-attribution]`).
- The scene kit stays free of default colors, fonts, borders, button styles, and theme tokens.

## 6. Quality bar

Every presentation you hand back:

- builds with no type errors (`npm run build`),
- renders its first step without runtime or console errors,
- has a caption on every step,
- supports next/previous navigation,
- passes the visual composition check (phase 4),
- conforms to the evolving-scene model (section 5).

When done, tell the user the route (`/<slug>`), how to run it (`npm run dev`), what you assumed, and the status of build, verify, and any remaining advisory warnings.

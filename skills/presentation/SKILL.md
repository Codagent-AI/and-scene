---
name: presentation
description: Create or modify a single-scene, evolving diagram presentation (React + Vite + Motion) from a topic. Use when the user wants to make, build, edit, or change a presentation, talk, deck, or slides — it interviews them, self-bootstraps the app and scene kit if missing, generates the steps, and self-verifies build, render, and visual composition.
---

# presentation

Builds presentations that are **one scene that evolves through named steps** (entities appear, move, connect, re-label),
not unrelated slides. This file is the procedure; longer reference material is linked below.

Throughout, `SKILL_DIR` is the directory that contains this `SKILL.md`. Resolve every template path relative to
`SKILL_DIR` (`SKILL_DIR/templates/bootstrap/`, `SKILL_DIR/templates/presentation/`) — **never** relative to the
caller's working directory. Optional helper: `node SKILL_DIR/scripts/scaffold-lib.mjs detect <dir>` prints the
anchors, monorepo signals, resolved target, and templates path as JSON.

## 1. Gather

Ask the user **one question at a time** for whatever is missing — never several at once, and never assume what the
user can still tell you:

1. the topic (and audience/length if it matters),
2. the visual style (palette, mood, typography feel),
3. for each step: its content (title, caption, what changes) and its visual description.

Rules:
- If the prompt is already complete (topic, style, every step), skip the questions and build.
- The user controls the depth. If they choose to build with partial detail, build from what you captured — no hard
  completeness gate — and invite iteration afterwards.
- For a key or visually complex step you may draw an ASCII mockup and ask the user to confirm the layout before
  building. Do this only where it helps, not for every step.

## 2. Resolve the target and scaffold what is missing

A presentation depends on three **contract anchors**, detected by contract, not byte-identity (file naming,
formatting, and extra dependencies must not trigger re-scaffolding):

| Anchor | Contract | Template files that provide it |
| --- | --- | --- |
| Build setup | Vite + React + TypeScript app whose `npm run build` works | `package.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.gitignore`, `.npmrc`, `src/main.tsx`, `src/Router.tsx`, `src/route.ts`, `src/Landing.tsx`, `src/index.css`, `verify.config.json`, `scripts/` |
| Scene kit | `Step`/`Scene` contract, stage/host that mounts the active step and runs morphs, present/browse nav, chrome (captions, ToC), fit-scale canvas | `src/presentation-kit/**` |
| Presentation index | registry mapping each presentation slug to its own route | `src/presentations/index.ts` (+ starter) |

**Resolve the target** (check in this order):
1. Already inside a presentation app (all three anchors present in the current dir or an ancestor/`presentations/`
   child) → use it; skip scaffolding.
2. Empty directory or standalone (non-monorepo) project → the project root.
3. Monorepo → a self-contained app in `presentations/`, not the repository root. Monorepo signals (any one):
   `workspaces` in `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout. This is a heuristic.

**Confirm before writing** — in a non-empty project that lacks the scene kit or the presentation index, state the
resolved target directory and which anchors are missing, and wait for the user's confirmation before writing
anything. (Empty directories need no confirmation.)

**Scaffold only what is missing:**
- None present → copy all of `SKILL_DIR/templates/bootstrap/` (including dotfiles) into the target. The starter
  presentation stays until your first real presentation is registered and verified; then remove it (folder and registry
  line) and point `verify.config.json` at the new presentation's slug.
- Some present → copy only the files of the missing anchors (table above). Never overwrite an existing file or
  presentation; if a needed file exists with different content, leave it and adapt your output to it.
- **Merge `package.json`** — add missing scripts and dependencies from the template's `package.json`; never
  overwrite or downgrade existing entries. Full required set: runtime `react`, `react-dom`, `motion`, `lucide-react`;
  dev `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `eslint`,
  `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`,
  `playwright`, `vitest`. Do not assume anything is already installed.
- Install: `npm ci` when the lock file came from the template, else `npm install`; then
  `npx playwright install chromium` if Chromium is missing.
- The scaffold is **style-neutral**: no Tailwind, no Tailwind Vite plugin, no default theme, colors, fonts, card,
  button, border, or shadow styles. Never add styling to `src/presentation-kit/`.

See `templates/README.md` for details of materialization and partial scaffolding.

## 3. Generate or modify

**Create.** In `<target>/src/presentations/<slug>/` (the presentation's own folder — never in the kit) write, from
`SKILL_DIR/templates/presentation/` with the documented substitutions:
`entities.ts`, `outline.ts`, `TalkScene.tsx`, `steps/*` (+ `steps/index.ts`), `Talk.tsx`, and a plain-CSS `talk.css`.
Then register it with **one new line** in `src/presentations/index.ts` (`{ slug, title, load: () => import('./<slug>/Talk') }`).
Preserve existing presentations and registry lines. Apply the user's visual style in the presentation's CSS.

**Modify.** If the target presentation is unspecified or ambiguous, list the existing presentations (from the registry)
and ask which one. Then ask only about the requested changes and make scoped edits to that presentation's files; do not
regenerate or restyle the rest.

**Rules**
- Model: one evolving scene — stable entity ids, grouped steps, entity continuity. See
  [references/scene-model.md](references/scene-model.md).
- Step and caption authoring: [references/step-authoring.md](references/step-authoring.md).
- Kit hooks and primitives: [references/kit-reference.md](references/kit-reference.md).
- CSS: **plain CSS by default** in the presentation's own folder. Use Tailwind or another framework only if the host
  already uses it or the user asks. Guidance: [references/styling.md](references/styling.md).
- Quality bar: every step has one clear idea; important content fits the 880×380 canvas; text is legible; intentional
  overlaps stay readable; nothing collides with captions, progress, ToC, or navigation; the active ToC/progress item and
  the attribution are visibly styled.

## 4. Self-verify (required before reporting success)

1. Run the build (`npm run build`) and fix every error.
2. Render check: `npm run verify` in the target is the full gate (build + render of every step); during iteration at
   least confirm the first step renders at its route with no console errors. Reserve the full `npm run verify` for
   completion. If `verify.config.json` names a different presentation, point its `slug` at the new one.
3. Visual composition: run the **project-local** helper `npm run inspect -- <slug>` (screenshots in
   `artifacts/inspection/<slug>/step-NN.png`, advisory `WARN` lines). Prefer it over ad hoc scripts; if a temporary
   Playwright helper is ever unavoidable, create it under the project root, never `/tmp`.
4. Look at the screenshots: the **first**, the **last**, and the **dense or key** steps — plus a narrow viewport
   (`npm run inspect -- <slug> --viewport 390x844 --skip-build`) when the presentation is responsive-sensitive. Use
   `chrome-devtools-axi` (`open`, `snapshot`, `screenshot`) when available, otherwise an equivalent browser view.
   Confirm content fits the fixed canvas, intentional overlaps are readable, and nothing collides with chrome.
5. Review **every** `WARN`: open the referenced step; fix accidental collisions, indistinct current-step
   (progress/ToC) chrome, and unpolished attribution through presentation-owned CSS (`[data-presentation-active='true']`,
   `[data-presentation-attribution]`). Mark only intentional, readable overlaps with `data-presentation-allow-overlap`.
   Re-run until clean or every remaining warning is deliberately allowed.
6. **Never report success while a build, render, or visual check fails.** Report what you verified and anything left.

Do not commit build output, screenshots (`artifacts/`), or `node_modules`.

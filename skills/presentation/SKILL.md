---
name: presentation
description: Create or modify browser presentations as evolving scenes. Use when asked to turn a topic into a presentation, build an explainer, or change an existing presentation.
---

# Presentation skill

Create browser presentations as one evolving scene. Follow **gather → resolve target and scaffold → generate or modify → self-verify**. Resolve every template path relative to this file's directory (`templates/bootstrap/` and `templates/presentation/`), never from the caller's working directory.

## 1. Gather requirements

For a new presentation, inspect what the request already specifies. Ask one concise question at a time for missing information, in this order: topic; visual style; then each step's narration (title and caption) and visual description. Do not invent details the user could still supply. The user may answer **“build with what we have”** at any point; accept partial detail and iterate without a completeness gate. If the request already gives the topic, style, and step details, proceed without questions. For a key or complex composition, an ASCII mockup may help; use it selectively, not for every step.

Explain that the artifact is one scene progressing through named steps. Keep entity IDs and `layoutId`s stable when an entity persists so it morphs in place. Use the same `Scene` and `groupKey` for adjacent states of a continuing diagram. Use `Appear` for newcomers after persistent entities settle. Mark only intentional, readable overlaps with `data-presentation-allow-overlap`.

## 2. Resolve target and scaffold

Inspect the current project before writing. Detect three anchors by their contracts, not byte equality or cosmetic filenames:

1. Build setup: Vite + React + TypeScript and a working `npm run build`.
2. Scene kit: typed `Step`/`Scene` contract, stage/host, present/browse navigation, chrome, and fit-scale canvas.
3. Presentation index: a registry mapping slugs to presentation routes.

If already inside a presentation app, use it and preserve every present anchor. Otherwise, an empty or standalone project targets its root. Detect a monorepo from `workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout; target a self-contained app under `presentations/`. For a non-empty project missing the scene kit or index, state the target and wait for confirmation before writing.

For a full scaffold, copy `templates/bootstrap/` into the resolved app root. For partial scaffolding, copy only the missing contract area and its required dependencies:

- Missing build setup: merge the bootstrap's Vite, TypeScript, ESLint, HTML, and ignore configuration, plus `src/main.tsx` and `src/index.css`, into the app. Keep unrelated host files intact.
- Missing scene kit: copy `templates/bootstrap/src/presentation-kit/` into the app's source tree.
- Missing presentation index/routing: merge the bootstrap's `src/presentations/index.ts`, `src/main.tsx`, and `src/Landing.tsx`, adapting imports/routes to existing host conventions while preserving registered entries.

Merge dependencies into an existing `package.json` by adding only missing required names and scripts; preserve existing values, scripts, package manager, workspaces, and unrelated dependencies. The full dependency set is runtime `react`, `react-dom`, `motion`, `lucide-react`; dev `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `@eslint/js`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`, and `playwright`. Install Chromium with Playwright (`npx playwright install chromium`) for render verification. Do not add Tailwind or another framework unless the host already uses it or the user requests it.

The kit and host scaffold are style-neutral: no default palette, typography, borders, shadows, card/button appearance, spacing scale, or theme tokens. Visual styling belongs to the presentation or host.

## 3. Generate or modify

For a new presentation, create `src/presentations/<slug>/` as a self-contained unit using `templates/presentation/` as a documented skeleton: `entities.ts`, `steps/step-*.tsx`, `Talk.tsx`, and `<slug>.css`. Replace every `REPLACE_*` token in copied examples with topic-specific values; do not leave placeholders in generated files. Include a caption for every step, stable IDs, and next/previous navigation via the kit. Import presentation-owned plain CSS by default. Add exactly one registry entry for the new slug and leave existing presentations untouched.

For a modification request, if the target is missing or ambiguous, list the registered presentations and ask which one to change before editing. Once identified, ask only about the requested change and scope edits to that presentation; do not repeat the full create interview.

## 4. Self-verify

Run `npm run build`, then at least a first-step browser render check with no runtime or console errors. Prefer the project-local `npm run inspect -- <slug>`; it captures settled screenshots and reports advisory diagnostics. Review the first and last steps plus every dense/key step. If responsive-sensitive, also inspect a narrow viewport, for example `npm run inspect -- <slug> --viewport=390x844`. Confirm the diagram fits its fixed canvas and does not collide with captions, ToC, progress, or controls. Review every warning: fix accidental overlaps, indistinct active chrome, and unpolished attribution in presentation-owned CSS; use the allow-overlap marker only for intentional readable overlaps. If no local inspection helper exists, put any temporary Playwright helper under the project root.

Fix failures and re-check. A lighter initial loop of build plus one-route render is acceptable while iterating; before reporting success, run the full `npm run verify` (build and all-step render checks). Never report success on failing output, and report any remaining advisories accurately.

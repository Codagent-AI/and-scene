---
name: presentation
description: Create or modify browser presentations as one evolving diagram, with a reusable scene kit and self-contained bootstrap templates.
---

# Presentation

Use this procedure to create a presentation from a topic or modify an existing presentation. A presentation is one scene moving through named states, not a deck of disconnected slides. `Talk.tsx` is simply the entry component filename.

## 1. Gather the story

First identify whether this is creation or modification. For creation, gather the topic, visual direction, and each step's content and visual description. Ask one question at a time for missing information; do not invent information the user can still provide. Accept a complete prompt without redundant questions. Let the user control depth: explicitly offer to build from partial detail and iterate, and proceed when they choose that option. There is no completeness gate. For a complex/key layout, optionally sketch an ASCII mockup to confirm composition; do not require one for every step.

For modification, identify the target first. If unspecified or ambiguous, list existing registry entries and ask which one to modify before changing any files. Once identified, ask only about the requested changes (steps, entities, style); do not repeat the full creation interview. Preserve other presentations and unrelated files.

## 2. Resolve the app and missing infrastructure

Resolve all template paths relative to **this SKILL.md's directory**, never the caller's working directory:

- `templates/bootstrap/`: complete self-contained Vite/React/TypeScript app.
- `templates/presentation/`: presentation-local starter files to copy into a chosen app.

Find the nearest existing presentation app first. Evaluate anchors within the resolved presentation app: a workspace-root build does not replace the build setup of a new self-contained nested app. Preserve that root build while supplying the nested app its own build setup. Detect these three anchors by their **contracts**, not identical filenames, formatting, or dependency lists:

1. A working Vite + React + TypeScript build setup (`npm run build`).
2. A topic-agnostic scene kit with typed Step/Scene contracts, stage/morph host, navigation, present/browse chrome and fit scaling.
3. An explicit presentation registry and routing that supports coexistence.

When all three exist, reuse the app without re-scaffolding. When some exist, preserve them and add only missing anchors and dependencies, adapting imports to their contract. Never replace a valid anchor merely because its names or appearance differ from the template.

If no existing app is usable, detect a monorepo by package.json `workspaces`, `pnpm-workspace.yaml`, or an `apps/` or `packages/` layout. In a monorepo, create a self-contained app at `presentations/`, leaving root build/workspaces/unrelated content intact. In an empty or standalone project, target the root. In a non-empty project that lacks a scene kit or registry, **state the exact proposed target and wait for user confirmation before writing**. This applies to partial scaffolding too. If the target directory already contains unrelated content, preserve it and resolve conflicts rather than overwriting it.

For a full scaffold, copy bootstrap contents, including dotfiles and lock data, into the resolved app. For partial scaffolding copy only the missing anchors, and merge necessary package scripts/dependencies without replacing existing build configuration. Install dependencies in the target app. A fresh complete template uses `npm ci`; a merged partial scaffold uses `npm install` after the package merge and retains the updated lockfile. Do not assume dependencies are installed.

Ensure the full set exists: runtime `react`, `react-dom`, `motion`, `lucide-react`; build/dev `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `playwright`. The template also includes Vitest/component test dependencies. Install Playwright Chromium with `npx playwright install chromium` if needed.

Bootstrap is intentionally unstyled. Do not add Tailwind, a Tailwind plugin, default fonts/colors, spacing tokens, borders, cards/buttons, shadows or a theme to the kit or scaffold. Styling systems are optional when already used by the host or explicitly requested by the user.

## 3. Generate or modify

Create `src/presentations/<slug>/` with `entities.ts`, `steps/`, `Talk.tsx`, and presentation-local CSS. Start from the presentation templates. Keep stable namespaced entity identities. Use the kit's `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, and `SceneLayer` as appropriate; raw motion elements with stable `layoutId`s are supported for coordinate-heavy diagrams.

Each Step has id, era, one-line presenter title, paragraph browse caption, Scene and typed payload. Numbering derives from array order. Adjacent beats of one diagram share the same `groupKey` **and Scene component**, updating payload rather than remounting. Preserve entity keys/layoutIds and coordinates for continuing entities; do not wrap them in newly keyed entrance wrappers. `Appear` delays newcomers until the layout transition settles; use AnimatePresence for departing entities. Keep intentionally readable stacks/overlap instead of spreading a composition to suit an implementation pattern.

Use the fixed 880 × 380 canvas and per-mode fit geometry. Design for legibility at the expected viewport. Every step has a caption (shown in browse mode) and supports next/previous navigation. Present mode is title-focused. Add only the new explicit `{ slug, title, load }` entry to `src/presentations/index.ts`, preserving every existing folder and entry. Confirm the route corresponds to that slug. For modification, edit only the selected presentation and strictly necessary registration/verification artifacts.

Plain presentation-owned CSS is the default. Own all palette, typography, spacing, border/shadow/card and button treatments there or in the host. Style `[data-presentation-active="true"]` distinctly for both progress and ToC; style `[data-presentation-attribution] a` to be legible and intentional. Keep the default bottom-right `made by and-scene` GitHub link. Top-left branding is host opt-in. Never move visual defaults into the reusable kit.

## 4. Verify and repair before completion

Run from the target app, using local dependencies:

1. `npm run build`: all presentations and the index must type-check/build.
2. `npm run verify -- --slug <slug>`: real Chromium production-preview render check of the target (at least its first step must be clean; the provided script checks every step). The canonical repository's `npm run verify` additionally verifies the full nine-step reference outline. Run that full gate when the canonical reference is present. Never mask build, console, page, or transition errors.
3. Prefer `npm run inspect -- <slug>` for settled desktop screenshots and advisory diagnostics. This project-local helper uses local Playwright and writes `artifacts/inspection/<slug>/step-NN.png`. If unavailable, place any temporary Playwright helper **under the project root**, not in an external temp directory. Always use `127.0.0.1` for preview, readiness, and browser navigation.
4. Review the first, last, and all dense/key step screenshots or equivalent browser views. For responsive-sensitive output, also check a narrow viewport. For interactive browser inspection use `chrome-devtools-axi`: start with snapshot then screenshots. The helper is preferred for capture; AXI supports focused debugging.
5. Check that important content fits the fixed canvas, intentional overlap stays readable, and scene text does not accidentally collide with captions, progress, ToC, or navigation. Review every overlap or chrome warning's cited step. Fix accidental collisions, indistinct active chrome, and undersized/browser-default attribution in presentation/host CSS. Only genuinely intentional readable overlapping subtrees may use `data-presentation-allow-overlap`; never blanket-mark the whole presentation to silence diagnostics. Warnings and screenshots are advisory review artifacts, not automated proof of visual quality.

If build, render, or visual review fails, fix the fault and rerun the affected checks and inspection. Do not report success while failures remain. Preserve scoped modifications and existing routes throughout repairs. Report the route, changed artifacts, checks performed, and any remaining advisory warnings accurately only after successful verification and visual review. Do not publish or deploy.

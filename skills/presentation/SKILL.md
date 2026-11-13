---
name: presentation
description: Create or modify browser presentations as one evolving diagram, with a self-bootstrapping React scene kit and local build/render/visual verification.
---

# Presentation

Use this procedure to turn a topic into a browser presentation, or to modify an existing one. A presentation is one evolving scene with stable entities, not independent slides. `Talk.tsx` is just its entry filename.

Resolve this file's directory first. Every path below (`templates/bootstrap/`, `templates/presentation/`, `scripts/scaffold.mjs`) is relative to **this SKILL.md**, never the caller's current directory. Do not execute commands from an assumed repository location.

## Gather

For creation, use supplied details first. Ask for missing information **one question at a time**: topic, audience/visual style, then each step's content and visual description (title, caption, diagram and what continues, enters, exits or morphs). Do not invent details the user can still provide. The user decides depth: offer to build with captured partial detail and iterate, without a completeness gate. A complete prompt can proceed immediately. Optionally show an ASCII mockup for a key/complex layout; do not require mockups for every step.

For modification, identify the target before edits. If unspecified or ambiguous, list existing registry entries and ask which one to modify. Once identified, ask only about the requested steps, entities or style; do not restart creation gathering. Preserve other presentations and unrelated files.

## Resolve the application and missing anchors

Inspect the target's contracts, not exact filenames or formatting:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A topic-independent scene kit with typed Step/Scene payloads, a stage/host with stable-entity motion, present/browse navigation, captions/ToC and fixed-canvas scaling.
3. An explicit presentation registry with independent routes and a landing index.

Cosmetic renames, extra dependencies and different formatting do not make an anchor missing. Reuse a complete app. If already inside a presentation app, add only missing anchors and dependencies without replacing existing contracts. If an anchor's filenames differ from these templates, adapt imports at its boundary instead of copying a conflicting second implementation.

For an empty or standalone project resolve the app to its root. For a monorepo (package.json workspaces, pnpm-workspace.yaml, or packages/ or apps/ layout), resolve a self-contained app under `presentations/`, preserving the root and unrelated content. Resolve the target before deciding its missing anchors: a monorepo root build is not the nested app's build. If `presentations/` already has unrelated content, identify a safe app location there and explain it.

In a non-empty project lacking the scene kit or index, state the resolved target and **wait for user confirmation before writing**. Do not infer confirmation from silence. This requirement applies to future skill invocation; explicit session authorization still controls the current task.

If all anchors exist, skip scaffolding. If none exist, scaffold all three. If partial, add only missing anchors and their dependencies. Never overwrite existing presentations or configuration. The optional helper takes the agent's contract assessment, not a filename-based guess:

```sh
node <skill-directory>/scripts/scaffold.mjs <resolved-app> --missing=build,kit,index --confirmed
```

Use `--confirmed` only after required confirmation (or existing explicit authorization). Remove present anchors from `--missing`. When preserving the index and adding a missing verify command, select an existing registered route and pass `--verify-slug=<slug>`; the helper rejects omission before writing instead of assuming the starter exists. Existing verify commands are preserved. It copies only absent files and merges required dependencies/scripts without replacing existing scripts. Review conflicts and adapt the boundary rather than overwriting existing files. The helper installs dependencies; alternatively materialize selectively and run `npm install` in the resolved app. Use its committed lockfile for a complete fresh snapshot and `npm ci` for subsequent installs.

Ensure the full dependencies even in a partial app: react, react-dom, motion, lucide-react; vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/node; ESLint with JS/TypeScript/hooks/refresh configuration and globals; playwright for production render checks. The bootstrap also supplies Vitest/jsdom/testing-library for fast contract tests. Install matching Playwright Chromium (`npx playwright install chromium`) if unavailable. Do not assume host dependencies are installed.

The scaffold and kit have **zero presentation styling defaults**. Do not add Tailwind, a Tailwind plugin, a CSS theme, default palette, font, spacing scale, borders, shadows, cards or button treatments. A host's existing framework or an explicit user request can supply one. Plain presentation-local CSS is the default.

## Generate or modify

Use `templates/presentation/` as a structural starter; replace placeholder names, metadata and scene content. Generate `src/presentations/<slug>/entities.ts`, `steps/`, `Talk.tsx`, and presentation-owned CSS. Stable entity IDs must be namespaced per presentation. Each step has a stable ID, era, one-line title, paragraph caption, typed payload and Scene. Derive numbering from array order.

Adjacent beats of the same diagram share **both** a groupKey and Scene component. Update payload without remounting. Continuing entities use stable layoutId/layout projection and are not wrapped afresh in newcomer fades. Use Appear only around newly arriving entities and retain AnimatePresence for departures. Intentional stacked compositions stay stacked. Raw motion elements with stable layoutId and class/style hooks are supported when primitives are unsuitable. Use the kit's 880 × 380 design canvas and mode geometry, without internal responsive reflow.

Keep all visual choices in presentation/host CSS: typography, palette, spacing, borders, shadows, node and control treatments. Style semantic `[data-active="true"]` progress and ToC states distinctly and `[data-presentation-attribution]` legibly. Default attribution is the bottom-right “made by and-scene” GitHub link. Header branding is host opt-in.

Register a new presentation with one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` entry in the existing index. Never replace the index or existing directories. Ensure every existing route remains registered/reachable. Modifications edit only the selected presentation plus necessary registry/verification artifacts.

## Verify and repair before success

Run in the resolved app:

```sh
npm run build
node scripts/verify.mjs <target-slug>
npm run inspect -- <target-slug>
```

The target-specific render check renders all steps (at minimum the first must be clean), rejects console/page errors and stalled navigation, and cleans up its preview/browser. `npm run verify` in this repository additionally validates the canonical nine-step reference; the fresh bootstrap verifies its getting-started route. Preview binding, readiness and browser URLs use **127.0.0.1** consistently. Fix build/type errors, runtime/console failures and transition faults and rerun affected checks; never report success with failing checks.

Perform a browser visual composition check before reporting completion: review settled screenshots or equivalent browser views of the **first**, **last**, and **dense/key** steps; for responsive-sensitive presentations also check a **narrow viewport**. Use the project-local screenshot helper when available, rather than ad hoc scripts outside the project. It captures every step at desktop size under `artifacts/inspection/<slug>/`; review its report and screenshots. If absent, create any temporary Playwright helper **under the project root** so local tooling resolves. For interactive inspection use chrome-devtools-axi when installed (start with snapshot, then screenshot); keep deterministic verification in the project Playwright scripts.

Check that important content fits the canvas, intentional overlaps remain readable, and scene content does not collide with captions, progress, ToC or navigation. Review every advisory collision or chrome/attribution warning. Fix accidental overlaps, indistinct active states and illegible/default attribution in local CSS. Only mark genuinely intentional, readable overlap subtrees with `data-presentation-allow-overlap`; do not blanket-exempt the scene to silence warnings. Re-run inspection after repairs. Screenshots/warnings are advisory review artifacts, not an automated visual-quality pass.

A generated result must have no type errors, a clean first-step render, captions for every step in browse mode, next/previous and direct navigation, clamped boundaries, functioning modes, one evolving scene and a completed visual review. Report the route, files changed, checks run, and any remaining advisory findings accurately. Do not publish or export; those are outside this skill.

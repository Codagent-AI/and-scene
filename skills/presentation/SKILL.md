---
name: presentation
description: Create or modify a browser presentation as one evolving scene, scaffolding missing infrastructure and verifying the result.
---

# Presentation

Use this procedure to create or modify presentations. A presentation is one evolving diagram with stable entities, not unrelated slides. The entry component is incidentally called `Talk.tsx`.

## Gather

Read the request before asking. Ask one question at a time for missing topic, visual style, and each step's content and visual description, including title, paragraph caption, era, and what persists or morphs between beats. Never assume details the user can still provide. The user controls depth: explicitly allow building with partial detail and iteration, without a completeness gate. A fully specified request can proceed immediately. Optionally show ASCII mockups of key or complex layouts; do not require one per step.

For modification, identify the target first. If absent or ambiguous, enumerate the existing registry and ask which presentation to modify before changing anything. Once identified, ask only about the requested step, entity, or style changes; do not repeat the create interview. Preserve other presentations and unrelated files.

## Resolve infrastructure

Resolve all template paths relative to **this SKILL.md directory**, never the caller's working directory: `templates/bootstrap/` and `templates/presentation/`. The shipped bootstrap contains everything needed for a self-contained app. The source repository also provides `scripts/scaffold.mjs`; its template URL is module-relative. A distributed skill may copy directly from its own templates without that convenience script.

Inspect contracts, not exact file names or formatting, and record which anchors exist:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A topic-agnostic scene kit with typed Step/Scene, persistent grouped host, morphs, navigation/modes/chrome, and fit-scale canvas.
3. A registry routing multiple presentations independently.

Cosmetic variations or extra dependencies are not missing anchors. Reuse all existing anchors; add only missing infrastructure and dependencies. If all exist, skip scaffolding. If none exist, copy the complete bootstrap. For partial scaffolds, merge only missing anchors and wire them into the existing build/router without overwriting existing implementations. Inspect any conflicts before writing; never overwrite existing content to force the template.

Already inside a presentation app: reuse that app. Otherwise detect a monorepo using package.json `workspaces`, `pnpm-workspace.yaml`, or `packages/` or `apps/` layout: create a self-contained app in `presentations/`, preserving unrelated root build setup. Empty/standalone projects scaffold at root. In any non-empty project lacking kit or index, state the exact target location and wait for user confirmation before writing. A prior explicit authorization of that target suffices.

Ensure the complete dependency set, without assuming installation: runtime `react`, `react-dom`, `motion`, `lucide-react`; dev/build `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, and `playwright`. Preserve host versions when compatible. Install dependencies in the resolved app (`npm ci` when a matching lock exists, otherwise `npm install`), then `npx playwright install chromium` if needed. A monorepo child must have its own complete manifest, lock, and scripts.

The bootstrap is styling-framework-neutral and has no presentation theme: do not add Tailwind, a Tailwind Vite plugin, default colors, fonts, spacing scales, borders, shadows, cards, buttons, or CSS theme tokens to the kit or generic scaffold. Only add a framework when already used by the host or explicitly requested.

## Generate or modify

Create `src/presentations/<slug>/entities.ts`, `steps/`, `Talk.tsx`, and presentation-local plain CSS using `templates/presentation/` as a guide. Namespace entity layout IDs by presentation. Keep one grouped scene component for related beats; update typed payloads in place. Do not wrap continuing entities in newcomer fades. Use kit primitives or raw motion elements with stable layoutIds and explicit coordinate/style hooks. Sequence new entities after layout motion; support exits for removed entities. Keep intentional readable stacking rather than flattening a diagram for implementation convenience.

Every step has stable id, era, presenter one-liner, browse paragraph caption, Scene, and payload. Number by array position. Use the 880 × 380 canvas; do not internally reflow on viewport changes. Each presentation owns its palette, typography, spacing, card/control treatment, visibly distinct active ToC/progress states, and legible bottom-right attribution through `data-presentation-*` hooks. Keep the reusable kit free of visual defaults. Header branding is opt-in.

Add exactly one explicit `{slug,title,load:()=>import('./<slug>/Talk')}` registry entry for a new presentation; preserve all existing entries, files, and routes. For modification, edit only the selected presentation and necessary integration artifacts. Preserve stable identities unless the requested change calls for a new entity.

## Verify and repair

Before reporting completion, run `npm run build`, and render the generated/modified route without console or page errors. Use `node scripts/verify.mjs --slug=<slug> --first-only` for a minimum first-step check, and the full route render without `--first-only` for completion; `npm run verify` also checks the canonical sample where supplied.

Run `npm run inspect -- <slug>` when the scaffolded project-local helper exists. Prefer it over ad hoc scripts outside the project tree: local browser dependencies resolve correctly and each step is captured after the 800ms settle interval. If absent, create any temporary Playwright helper **under the project root**, never outside it.

Review the first, last, and dense/key settled screenshots or equivalent browser views. Also review a narrow viewport for responsive-sensitive presentations (the helper's exported inspect function accepts `viewport`). Ensure important content fits the canvas, intentional overlaps remain readable, and nothing collides with captions, progress, ToC, or controls. Use chrome-devtools-axi for interactive inspection when available in the environment.

Review each step-specific advisory: fix accidental text/chrome collisions, indistinct current-step controls, and missing/small/browser-default attribution. Only genuinely intentional readable overlap may be exempted by `data-presentation-allow-overlap` on its subtree; do not blanket-mark the diagram to silence warnings. Locally style active hooks and attribution; do not fix polish by adding kit defaults.

Build, render, or visual failures must be fixed and rechecked before success. Screenshots and advisory warnings support visual review; they do not certify taste automatically. Report actual checks and remaining advisory findings accurately; never report success on broken output.

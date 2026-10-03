---
name: presentation
description: Creates, scaffolds, and modifies browser presentations as evolving scenes. Activates for requests to create a presentation, build a visual explainer, or modify an existing browser presentation.
---

# Presentation skill

Create browser-based presentations as one diagrammatic scene that evolves through named steps. Read scaffold files from paths relative to this `SKILL.md` (resolve the skill directory first); never locate templates relative to the caller's working directory.

## Scope

This skill creates interactive browser presentations. It does not create PowerPoint, Keynote, PDF, or image exports. For those deliverables, use an appropriate slide or document generation workflow.

## 1. Gather requirements

Inspect the request before asking anything. Identify the topic, visual direction, and each step's title or message, caption, and intended visual change. Ask for missing information **one question at a time**. Do not invent details the user could provide. Offer a small ASCII layout only for a key or complex composition when it will clarify placement. The user controls depth: explicitly offer to proceed with partial detail and record what remains open; do not impose a completeness gate after they choose to proceed.

For a new presentation, gather an ordered narrative and how entities enter, persist, move, connect, or leave across steps. For a modification, first identify the target presentation. If the request does not name one and more than one exists, list candidates and ask which one; then ask only about the requested change. Do not repeat the creation interview for a scoped edit.

## 2. Resolve target and ensure the scaffold

Work in the project the user indicated. Inspect `package.json`, `pnpm-workspace.yaml`, and `packages/` / `apps/` layout for monorepo signals. Resolve the target as follows:

- Empty standalone directory: project root.
- Existing standalone project: root, preserving unrelated files.
- Monorepo: a self-contained app under `<repo>/presentations/` (do not mutate root build setup).
- Already inside an app that satisfies the anchors: that app.

Check the three anchors by contract, not filename or byte equality:

1. Build setup: Vite + React + TypeScript and a working `npm run build`.
2. Scene kit: typed step/scene contract, active-step stage with entity continuity/morph behavior, present/browse navigation, chrome/captions/ToC, and fit-scaled canvas.
3. Presentation index: explicit route registry allowing multiple independent presentations.

Reuse anchors that exist. Copy only missing scaffold pieces from `templates/bootstrap/`, merging files without replacing user content. Install dependencies needed by the missing infrastructure even if they are not yet present. If a non-empty project lacks the scene kit or index, state the exact target directory and files/anchors to be added, then wait for confirmation before writing there. Do not ask for confirmation in an empty directory or an already scaffolded app.

The bootstrap is styling-framework-neutral. Ensure runtime dependencies `react`, `react-dom`, `motion`, `lucide-react`; build/development dependencies Vite, `@vitejs/plugin-react`, TypeScript, `@types/react`, `@types/react-dom`, `@types/node`, ESLint and its configured plugins, and Playwright. Install from the target app directory. Do not add Tailwind or another styling framework unless it is already used by the host or requested.

## 3. Create or modify

For creation, add a self-contained folder under `src/presentations/<slug>/` (or the scaffold's equivalent), with presentation-owned entities, step components, `Talk.tsx`, and plain CSS for its visual design. Add one explicit registry entry and ensure its route loads. Never overwrite or restructure existing presentation folders. Use `templates/presentation/` for the entry component and `templates/step/` for step structure as a starting point, adapting them to the actual kit contract.

Represent each step as a state of the same scene. Give continuing entities stable IDs and positions; add newcomers without moving settled entities, and make changes explicit through morphs, links, emphasis, or exits. Each step needs a concise title and caption. Compose the fixed canvas to fit; keep important content clear of the navigation and caption chrome.

For a modification, edit only the selected presentation and the minimal registry or host files required. Preserve all other presentations and routes. Keep palette, typography, spacing, borders, shadows, card/button treatment, and CSS tokens in presentation-owned or host-owned stylesheets. The reusable kit must remain free of visual defaults.

## 4. Verify and inspect before reporting success

Run `npm run build`. Open the generated route in a production or development browser and check the first step for runtime and console errors. Prefer the target project's `npm run verify` for full production render verification and `npm run inspect -- <slug>` for settled per-step screenshots; run them when available. Otherwise use Playwright installed in the project and keep any temporary helper inside the project tree. Serve and navigate via `127.0.0.1`.

Inspect screenshots/browser views for the first and last steps plus dense, key, or transition-critical steps. Also inspect a narrow viewport when the design is responsive-sensitive. Review helper warnings: fix accidental text/chrome collisions, make active progress and ToC state visibly distinct, and polish attribution. Mark overlap as allowed only when it is intentional and still readable. Fix build, render, and visual issues, then rerun the affected checks. Do not claim success while a required check fails.

## 5. Report

Summarize the presentation or modification, route, files/registry changes, and build/render/visual checks actually completed. State any unresolved advisory warnings or checks that could not run accurately; do not imply unrun checks passed.

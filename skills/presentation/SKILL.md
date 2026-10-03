---
name: presentation
description: Creates or updates browser-based presentations as evolving scenes when users ask for a presentation, talk, or narrated visual walkthrough.
---

# Presentation

Create browser-based presentations as one diagrammatic scene that evolves through ordered steps. Reuse the host's scene kit and routing when they satisfy the contracts below. Keep each presentation self-contained and own its visual design.

## Out of scope

This skill creates browser-based evolving-scene presentations. It does not export PowerPoint, Keynote, PDF, or image files, or provide a visual editor, hosting, or publishing service. For those deliverables, use a tool designed for the requested format or workflow.

## 1. Gather the brief

Ask only for information that is missing, one question at a time. Gather:

1. The topic and intended audience or outcome.
2. The visual direction (palette, typography, mood, references, or a request for you to choose).
3. The ordered steps: what each step explains and what should be visible in its scene.

Do not silently invent details the user could still provide. A user may explicitly choose to proceed with partial details; record the open choices and make reasonable, reversible decisions for them. If a complex step depends on a precise composition, offer one compact ASCII mockup for that step and incorporate the response. Do not require a mockup for every step. If the request already supplies the topic, style, and steps, proceed without asking redundant questions.

For a create request, make a new presentation. For a modify request, first identify the target. If it is missing or ambiguous, list the available presentations and ask which one. Then ask only about the requested edits; do not repeat the full creation interview.

## 2. Resolve the project and its contract anchors

Resolve template paths from this skill's own directory, never from the shell's current working directory. The templates are under `templates/` beside this file.

Inspect the target repository and detect these three anchors by their contracts, not exact filenames or byte identity:

- **Build setup:** Vite + React + TypeScript with a working `npm run build`.
- **Scene kit:** a `Step`/`Scene` contract, a host that mounts active scene steps and supports entity morphs, present/browse navigation and chrome, and fixed-canvas fit scaling.
- **Presentation index:** an explicit registry mapping independent presentations to routes.

If all three exist, reuse them. If any are missing, preserve valid existing anchors and scaffold only the missing infrastructure and its dependencies. Treat cosmetic differences, extra dependencies, and alternate filenames as valid when the contracts work. Before writing, determine the app target:

- Empty directory or standalone app: scaffold at the project root.
- Monorepo (workspace declaration, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout): use a self-contained app in `presentations/`.
- If a monorepo already has a `presentations/` app, use that app when it is the intended target.

For a non-empty, unscaffolded target, state the resolved location and what infrastructure is missing, then wait for confirmation before writing. Empty directories do not need confirmation. For a partially scaffolded monorepo, retain the root build and unrelated files; add only the missing app infrastructure inside the resolved `presentations/` app. Copy templates by resolving paths relative to this `SKILL.md` (for example, using the skill file's absolute parent directory), not by assuming the current working directory.

The bootstrap snapshot in `templates/bootstrap/` is a complete, buildable app and canonical scene-kit snapshot. `templates/presentation/` provides a complete presentation starter; `templates/step/Step.tsx` is a reusable per-step starter to adapt into that presentation's `steps/` directory. When using these, copy the relevant files without overwriting user files, then compare the kit contracts and adapt only what is missing. Do not replace an existing app wholesale to fill one missing anchor.

Ensure these dependencies are declared and installed when required; do not assume an existing install contains them:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build and types: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`.
- Lint: ESLint and its TypeScript, React Hooks, and React Refresh configuration dependencies.
- Browser render checks: `playwright` and an available Chromium browser.

Use the host package manager and lockfile. Do not add Tailwind or another styling framework unless the host already uses it or the user asks for it.

## 3. Create or modify the presentation

Create a new route as its own folder, with presentation-owned entities and step components, and add one explicit entry to the presentation registry. Leave existing presentations and routes intact. For modifications, edit only the selected presentation and the directly required registry or host files; preserve unrelated presentations.

Represent the work as a single evolving scene:

- Each step has a stable id, era/section, short presenter title, browse caption, and scene state.
- Derive displayed numbering from order; do not manually number steps.
- Keep stable entity ids across steps for elements that persist. Compose the generic kit primitives or raw motion elements with stable `layoutId`s for coordinate-heavy diagrams.
- Keep adjacent steps in a shared scene group when they update the same evolving diagram. Preserve intentional stacking and overlap. New entities should appear after persistent entities settle; entities that leave should exit cleanly.
- Give every step a useful caption, and ensure next/previous and direct navigation remain usable.

Keep the scene kit style-neutral. Put visual styling in presentation-owned CSS (plain CSS by default) or an existing host styling system. Do not add palette, fonts, spacing scales, borders, shadows, card/button treatments, or theme tokens to the reusable kit. Style the active progress/section state and the attribution locally so both are legible. Mark only intentional, readable overlap with the kit's explicit allow-overlap hook when available.

## 4. Verify, inspect, and repair

Do not report completion until the presentation passes all applicable checks. Run the app's build command. Open the presentation route in a real browser and confirm the first step renders without runtime or console errors; navigate through the steps and check captions and next/previous behavior. Prefer the project's local verification command when available (typically `npm run verify`).

Inspect settled browser views of the first step, last step, and any dense or visually important step. Also inspect a narrow viewport when the composition is responsive-sensitive. Prefer the project-local screenshot helper (typically `npm run inspect -- <slug>`); if none exists, put any temporary Playwright helper inside the project root and remove it afterward. Review every advisory warning. Fix accidental collisions, indistinct active navigation, or illegible attribution; retain an overlap exemption only for an intentional, readable composition. Re-run build, render, and inspection after fixes. If a check fails, repair it rather than reporting success.

The bootstrap includes `npm run verify -- <slug>` and `npm run inspect -- <slug>` helpers. They use the app's local Playwright installation and preview server on `127.0.0.1`.

## 5. Report completion

Use this concise structure:

```text
Presentation: <title and route>
Files: <added or changed files>
Checks: <build, render, and visual checks with results>
Warnings or decisions: <unresolved advisory warnings and choices made from partial input, or “none”>
```

Report success only after required failures are fixed; distinguish an advisory warning from a failed check.

---
name: presentation
description: Create or modify browser presentations as one evolving scene using the local And Scene kit. Use when asked to make a presentation, explain a topic visually, or change an existing presentation.
---

# Presentation

Create browser presentations as one diagram that evolves through named steps. Use the shared scene kit for behavior and geometry; each presentation owns its content and visual design.

## 1. Identify the request

Decide whether the user wants a new presentation or a change to an existing one. For a modification, inspect the registry first. If the target is missing or ambiguous, list the registered presentations and ask which one to change before editing. Once selected, ask only about the requested change; do not repeat the create interview.

## 2. Gather requirements for a new presentation

Use the details already supplied. Ask one concise question at a time for missing information, in this order:

1. Topic or central idea.
2. Visual style and intended audience, if not already clear.
3. Ordered steps. For each step, establish its title or point, caption/narration, visual content and what appears, moves, connects, or changes from the previous step.

Do not invent details the user can still provide. Let the user choose the number and depth of steps. If the user explicitly wants to proceed with partial detail, build from the captured information, make only necessary implementation choices, and leave room to iterate. Do not impose a completeness gate. A compact ASCII sketch may help confirm a key or complex layout; use it selectively, not for every step. The user may provide all details in one prompt, in which case proceed without redundant questions.

## 3. Resolve the target and ensure infrastructure

Work inside the requested repository. Resolve this skill's directory from this `SKILL.md` location; template paths are relative to it, never to the caller's current directory.

Check the three anchors at contract level:

- **Build setup:** Vite + React + TypeScript and a working `npm run build`.
- **Scene kit:** typed `Step`/`Scene` contract, active-step stage with entity continuity/morphs, present/browse navigation and chrome, fixed fit-scale canvas.
- **Presentation index:** explicit registry mapping slugs to presentation modules/routes.

Do not require exact filenames, formatting, or byte identity to recognize an existing anchor. If an anchor is absent, scaffold only the missing infrastructure and dependencies; preserve existing files and presentations. Use `templates/bootstrap/` as the complete reference scaffold and copy from `templates/bootstrap/src/presentation-kit/` when the kit anchor is missing. Resolve `templates/bootstrap/` relative to this skill. Use `templates/presentation/` and `templates/step/` for generated presentation and step shapes.

Choose the scaffold target:

- Empty directory or standalone project: repository root.
- Monorepo (workspace declaration, `pnpm-workspace.yaml`, or `packages/` / `apps/` layout): a self-contained app under `presentations/`.
- Existing presentation app with anchors: that app; scaffold only missing anchors.

For a non-empty, unscaffolded project, state the resolved target and ask the user to confirm before writing. Do not ask again when the user has already confirmed that target. When a monorepo contains a partial build setup, preserve it and place missing presentation infrastructure in the self-contained `presentations/` app.

Install/ensure the complete dependencies listed by the bootstrap package manifest: runtime `react`, `react-dom`, `motion`, `lucide-react`; development/build `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, ESLint and its configured plugins, and `playwright`. Run the package manager's install after updating dependencies. Do not add Tailwind or another styling framework unless the host already uses it or the user requests it.

The kit is style-neutral. Do not add its palette, typography, spacing, borders, shadows, cards, buttons, theme tokens, or visual defaults. Plain CSS owned by the presentation is the default for a new visual design.

## 4. Create or modify

For a new presentation, create a self-contained folder under `src/presentations/<slug>/`, with an entity ID namespace, `Talk.tsx`, step modules as useful, and presentation-owned CSS. Compose generic kit primitives and register one explicit `{ slug, title, load }` entry. Preserve all existing folders and registry entries. Reuse stable entity IDs for concepts that persist between steps; give the steps a shared group key when a scene instance should update in place. New entities enter after continuing elements settle; departing entities have a readable exit. Keep the scene as an accumulation/evolution rather than independent slide redraws.

For a modification, edit only the selected presentation and the registration or host files strictly required by the requested change. Keep the kit generic.

Use `templates/presentation/` as a starting point and `templates/step/` for a step. Replace every placeholder and tailor entities, content, narration, and CSS to the request. Make sure every step has a concise title and a useful caption. Support the kit's next/previous navigation and fixed 880 × 380 design canvas unless the composition needs an explicit canvas override.

## 5. Verify before reporting completion

Run the host's build (`npm run build`) and fix failures. Open the generated route in the project's real browser render check when available (prefer `npm run verify`; otherwise use the bootstrap's `npm run verify -- <route>`). At minimum, the first step must render without runtime or console errors. Then use the project-local screenshot helper (`npm run inspect -- <slug>`); do not write a temporary helper outside the project. Let it settle transitions and capture all steps.

Review the first, last, and densest or key step screenshots; also inspect a narrow viewport when the composition is responsive-sensitive. Review overlap, active progress/ToC distinction, and attribution warnings. Fix accidental collisions and indistinct active controls; mark overlap as allowed only when intentional and readable. Rebuild, re-render, and re-inspect after fixes. Prefer the full project verification command when it exists.

Report the route, files created or changed, build/render/visual checks run, and any remaining advisory warnings accurately. Do not report completion while a build or render failure remains.

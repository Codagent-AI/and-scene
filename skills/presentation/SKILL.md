---
name: presentation
description: Creates or modifies navigable browser presentations with evolving scenes. Activates for requests to make a presentation from a topic, build a scene-based presentation, or change an existing presentation.
---

# Presentation

Create browser based presentations as one diagrammatic scene that evolves through named steps. The reusable kit owns behavior, geometry, and stable hooks; a presentation or its host owns the visual design. Work in the user's project and verify the result before reporting completion.

## Out of scope

This skill creates browser-based evolving-scene presentations. It does not create PowerPoint or Keynote files, export PDFs, or author conventional slide decks. Route those requests to an available slide or document authoring workflow that supports the requested format; if none is available, explain the limitation and offer the browser presentation format instead.

## 1. Gather the brief

Use the information already provided. Ask only for missing details, one question at a time:

1. What topic should the presentation explain?
2. What visual style should it use? If the user has no preference, offer a few concrete directions and let them choose or proceed without one.
3. What should each step say and show? For each step capture its title, caption/narrative, visual description, and what continues, changes, appears, or leaves from the prior step.

Do not fill in details the user can still provide. The user controls depth: if they want to proceed with a partial brief, record what remains open and make a coherent first pass without treating missing details as a blocker. A complete prompt may go directly to implementation. For a key or complex layout, an ASCII sketch can clarify composition; use it selectively, not for every step.

## 2. Choose create or modify

For a new presentation, make a self-contained directory under the app's `src/presentations/<slug>/`, with an entry `Talk.tsx`, local step/scene files, and local CSS as needed. Register it once in the explicit presentation index. Preserve existing entries and presentations.

For a modification, inspect the registry and existing presentations first. If the target is absent or ambiguous, list the available titles and ask which one to change before editing. Once identified, ask only about the requested change. Keep edits within that presentation and the specifically requested shared files; do not replay the full creation interview.

Use stable entity IDs owned by the presentation. Model each step as a state in one evolving scene: retain positions and identity for continuing entities, update their content in place, and introduce or remove entities deliberately. Use typed `Step<T>` payloads and shared `groupKey` values for steps whose scene instance persists. Every step needs a clear title and a useful caption. Compose generic primitives from the kit, not talk-specific kit extensions.

## 3. Resolve the app target and scaffold missing anchors

Resolve template paths from this skill file, never from the caller's current directory:

- Bootstrap snapshot: `templates/bootstrap/`
- Presentation component example: `templates/presentation/Talk.tsx`
- Step example: `templates/presentation/steps/step.tsx`

Resolve the app location before writing:

- If already in an app with the contract anchors below, work in that app and fill only missing anchors.
- In an empty directory or standalone project, use the project root.
- In a monorepo (a `workspaces` field in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout), use a self-contained app at `presentations/` rather than changing the monorepo root.
- In a non-empty project that lacks the scene kit or presentation index, state the chosen target and ask the user to confirm before scaffolding there. Do not write into that target until confirmed.

Check the three anchors by their contracts, not exact bytes or filenames:

1. **Build setup:** Vite + React + TypeScript configuration and a `build` script that runs successfully.
2. **Scene kit:** typed step/scene payload contract, active step host with entity layout transitions, present/browse navigation, captions/TOC chrome, and fixed fit-scaled canvas.
3. **Presentation index:** an explicit registry mapping unique slugs and titles to lazy entry components, used by a route.

Scaffold only missing anchors. Use the bootstrap snapshot as the known-good complete app and copy only files belonging to absent contracts; retain host files and user work. In a partial scaffold, reconcile imports/paths at the contract boundaries instead of replacing files whose anchors already exist. For a full scaffold, materialize the complete snapshot. Any copied path must be formed from this SKILL.md directory.

Ensure the complete dependency set, whether scaffolding all or part of an app. Runtime dependencies: `react`, `react-dom`, `motion`, `lucide-react`. Build and tooling dependencies: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `eslint`, the React ESLint plugins and config/parser stack, and `playwright`. Use the host's package manager and update its lockfile. Install any missing packages; do not assume that a dependency listed in `package.json` is installed. Do not introduce Tailwind or another styling framework unless the host already uses it or the user explicitly requests it.

The kit must remain style-neutral: no palette, typography, spacing scale, border, shadow, card/button treatment, theme token, or styling-framework requirement. Keep presentation appearance in presentation-owned plain CSS by default, or use the host's already established styling approach.

## 4. Generate or edit

Use the templates as examples, adapting them to the existing kit's exports and app structure. Keep each new presentation self-contained and reachable at its own route. Do not overwrite or rename another presentation. Put step scenes and their typed content in local files as useful; keep identity IDs stable across states. Add responsive treatments in presentation CSS where the scene or chrome needs them.

Keep authored content readable in the fixed scene canvas and clear of header, captions, table of contents, progress, and navigation. Active progress/TOC state must be visually distinct and the attribution must be styled legibly. Mark intentional readable overlaps on their subtree with `data-presentation-allow-overlap`; do not use the marker to excuse accidental collisions.

## 5. Verify and inspect before reporting done

Run the app's build and lint commands. Run the project's `npm run verify` when available; for a materialized bootstrap this checks build and browser-renders its registered route. At minimum, open the generated route in a real browser and check the first step for console errors. Prefer the project-local screenshot helper: `npm run inspect -- <slug>`. Run it after building so its production preview is current.

Inspect the first and last steps and any dense/key steps at a standard desktop viewport. Inspect a narrow viewport when the layout is responsive-sensitive. Use `chrome-devtools-axi` for interactive browser inspection when available: open the local `127.0.0.1` route, take a snapshot, then inspect screenshots. Review helper warnings for overlaps, indistinct active navigation, and attribution; fix accidental overlap and weak chrome styling, and retain an allow-overlap marker only for intentional readable composition. Re-run the relevant checks after fixes. If no local screenshot helper exists, use a temporary Playwright helper inside the project and remove it after review.

Do not claim success while build, render, or visual inspection failures remain. In the completion report, identify the route, concise content/design outcome, checks run, and any known limitation or partial-detail assumption.

---
name: presentation
description: Create or modify a browser presentation as one evolving, navigable scene. Use when a user asks for a presentation, visual explainer, or changes to an existing presentation.
---

# Presentation skill

Create a browser-based presentation whose diagram evolves through named steps. Use the reusable scene kit for behavior and primitives; the presentation owns its visual design.

## 1. Understand the request

Classify the request as **create** or **modify**.

For a new presentation, collect the topic, visual direction, and each step's narrative content and visual intent. Ask for missing details **one question at a time**. Do not fill in details the user could supply. If the user explicitly wants to proceed with partial detail, use what they provided, make only the minimum necessary connective decisions, and identify those decisions in the completion report. If the prompt already contains enough detail, proceed without asking redundant questions. A small ASCII sketch can help confirm a particularly complex scene; use it selectively.

For a modification, first identify the target presentation. If the request does not name one unambiguously, list the registered presentations and ask which one to change before editing. Then ask only for details needed to make the requested change; do not repeat the full creation interview.

## 2. Resolve the app and its target

Locate this skill file, then resolve every template path from its containing directory (for example, `templates/bootstrap/`); never assume the current working directory is the skill directory.

Inspect the project and detect these three anchors by their contracts, not exact formatting or filenames:

1. **Build setup:** Vite + React + TypeScript with a working `npm run build`.
2. **Scene kit:** typed step/scene payload contract; fixed fit-scaled stage that hosts active scenes and shared-entity motion; navigation and present/browse chrome with captions and table of contents.
3. **Presentation index:** an explicit or equivalent registry that maps multiple presentation slugs to independently loadable routes.

If all anchors exist, use the app as-is. If only some exist, scaffold only the missing contract(s), preserving existing build configuration, content, kit behavior, and presentations. Do not replace a present anchor because its names or formatting differ.

Choose a target before copying files:

- An empty directory or standalone project uses its root.
- A monorepo uses a self-contained app in `<repo>/presentations/`. Detect workspaces in `package.json`, `pnpm-workspace.yaml`, or a `packages/`/`apps/` structure.
- If already inside a presentation app with anchors, use that app.

When the target project is non-empty and not already scaffolded, state the exact target and intended scaffold before writing and wait for confirmation. An empty directory needs no confirmation. In a monorepo, preserve unrelated root files and build setup; install and run commands from the selected app directory.

For a full bootstrap, copy `templates/bootstrap/`. For a partial bootstrap, take only the missing files from that snapshot and adapt imports/configuration to the host. The bootstrap includes the kit snapshot at `src/presentation-kit/`; keep its non-test files byte-for-byte aligned with this repository's canonical kit when this skill is maintained.

Ensure the selected app has all dependencies required by the scaffold, even if some are already installed:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build and types: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`.
- Linting: `eslint`, `@eslint/js`, `typescript-eslint`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.
- Browser verification: `playwright`.

Use compatible current versions and update the selected app's package manifest and lockfile, then install dependencies. Before browser checks, run `npx playwright install chromium`. If it fails, resolve the install issue or report browser verification as blocked; do not skip the browser checks or claim completion. Do not add Tailwind or another styling framework unless the host already uses it or the user asks for it. The scaffold and reusable kit must not introduce a palette, font, spacing scale, borders, shadows, card/button treatments, or theme tokens.

## 3. Create or modify

For a new presentation, copy `templates/presentation/` as a starting point and use `templates/step/` for each step, placing each copied step directory at `src/presentations/<slug>/steps/<step-id>/` and importing its `step` object in narrative order. Replace all placeholder content. Give it a unique kebab-case slug and its own folder under `src/presentations/<slug>/`; register it once in `src/presentations/index.ts` using the host's registry shape. Keep entity IDs stable within the presentation and namespace layout IDs to avoid collisions. Use shared scene groups when one scene instance should update its payload across steps; compose the generic kit primitives in each scene.

The resulting presentation must have a caption for every step, next/previous and direct navigation through the kit, and a clear evolving-scene narrative. Put all colors, type, spacing, layout, and component treatment in presentation-owned CSS (plain CSS by default) or existing host styling. Do not edit reusable kit styles to make one presentation look right. Preserve every existing route and presentation.

For a modification, edit only the selected presentation and the minimum required registration or host files. Preserve its other steps and all unrelated presentations. Use focused edits corresponding to the requested steps, entities, or style.

## 4. Verify and inspect

Work from the app root. Build and run the available render check; fix failures and rerun both before reporting success. Prefer `npm run verify` when available. At minimum, open the created route in a real browser, check its first step for runtime/console errors, and traverse every step when the project provides full verification.

Use the app's project-local screenshot helper when present. Otherwise create any temporary Playwright helper under the app root and remove it after use. Capture settled screenshots of the first and last steps and every dense or visually important step.

For the bootstrap inspection helper:

- Run `npm run inspect -- <slug>` for the default 1440×1000 viewport.
- For responsive-sensitive layouts, run `npm run inspect -- <slug> --narrow` or set an explicit size with `npm run inspect -- <slug> --viewport 390x844`.
- Screenshots are written under `artifacts/inspection/<slug>/<width>x<height>-<wide|narrow>/`.

Review actual screenshots, not just successful command output. Check content fits the fixed canvas, intentional overlaps remain readable, and no content collides with captions, table of contents, progress, or navigation. Review each warning: fix accidental overlap, make active navigation visibly distinct, and style attribution locally so it is legible. Mark an overlap as allowed only when it is deliberate and remains readable. Rerun inspection after fixes.

Do not report completion while build, render, or visual inspection has an unresolved failure. In the final report state the route, files changed, build/render results, inspected steps and viewport(s), remaining advisory warnings, and any assumptions made after an explicit partial-detail choice.

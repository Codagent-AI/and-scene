---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with a reusable React scene kit, presentation-owned styling, and build/render/visual verification.
---

# Presentation

Use this workflow to create a presentation from a topic or modify an existing one. The result is a browser route, not an exported slide deck. Keep work local unless the user separately authorizes publication.

## Gather the story

Read the user's supplied details first. Ask only for missing information, one question at a time: the topic and audience, the visual style, then each step's content and visual description. Capture a stable step ID, era/section, one-line presenter title, browse caption, entities present, and what changes from the previous step. Ask about continuity as part of a step's visual description: what moves, changes label, enters, or exits?

Do not invent details the user can still provide. The user controls depth: when they explicitly choose to build from partial detail, proceed with the information captured and identify the choices left open for iteration. There is no hard completeness gate. If the input already contains topic, style, and all step details, proceed without repeating questions. For a key or complex composition, optionally offer an ASCII mockup to confirm the layout; do not require one for every step.

For modification, identify the target first. If the target is unspecified or ambiguous, enumerate existing registry entries and ask which presentation to modify before editing anything. Once identified, ask only about the requested changes. Do not repeat the full creation interview or change other presentations.

## Resolve the app and infrastructure

Resolve this skill's physical `SKILL.md` location, then set the template base to its containing directory. `templates/bootstrap/` and `templates/presentation/` below are relative to that directory, never relative to the caller's current working directory. Use absolute source paths when copying templates.

Before creating **or modifying**, inspect the target for three contract anchors:

1. A Vite + React + TypeScript build setup with a working `npm run build`.
2. A presentation-agnostic scene kit with typed Step/Scene contracts, an active scene host and entity morphs, present/browse navigation, captions/contents chrome, and a fit-scale fixed canvas.
3. A presentation registry and routing that let multiple presentations coexist at their own routes.

Judge these by behavior and integration, not exact filenames, formatting, extra dependencies, or equality with the bootstrap snapshot. Adapt imports to compatible existing anchors. Do not replace an anchor merely because it looks different.

Resolve where missing anchors belong before writing:

- If already inside a presentation app, reuse it and add only missing anchors.
- Otherwise detect a monorepo from `package.json` workspaces, `pnpm-workspace.yaml`, or an existing `packages/` or `apps/` layout. Place a self-contained app in `<repository>/presentations/`; preserve root build configuration and unrelated content. A root build anchor alone does not make the monorepo root the presentation app.
- For an empty directory or standalone project, use its root.
- If a non-empty project lacks the scene kit or presentation index, state the resolved target path and obtain the user's confirmation **before scaffolding**. Existing explicit authorization of that target suffices; do not silently choose a different target.

If no anchors exist, copy the full `templates/bootstrap/` snapshot into the resolved app. If some anchors exist, copy or adapt only files needed for the missing anchors and their dependencies. Merge package scripts, dependencies, and configuration without overwriting existing anchors, presentation entries, or unrelated files. Never copy a whole starter registry over an existing registry. Preserve a baseline diff or file list so preservation can be checked afterward.

Ensure the full required dependency set; do not assume installed modules or packages:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build and verification: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `playwright`.
- Lint: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`.
- The bootstrap's unit-test dependencies and scripts, if copied, must also be installed.

For an unchanged full bootstrap with its lock file, run `npm ci` in the resolved app. When merging dependencies into an existing app, update its package manifest and lock together with `npm install`. Make Chromium available with `npx playwright install chromium` if needed. Run package commands from the app directory, even when scaffolding in a monorepo.

The bootstrap and scene kit are style-neutral. Do not introduce Tailwind, a Tailwind Vite plugin, another framework, a theme, default colors/fonts, spacing scales, borders/shadows, cards, or button treatments. The host may retain an existing styling framework, or a user may request one; otherwise use presentation-owned plain CSS.

## Create or edit the evolving scene

For creation, choose a unique route-safe slug, create `src/presentations/<slug>/`, and copy the presentation starter from this skill's template directory. Replace its example story and identity namespace. Keep these presentation-owned artifacts:

- `entities.ts`: stable, presentation-namespaced entity IDs.
- `steps/`: ordered typed step definitions and their scene components.
- `Talk.tsx`: the entry component rendering `Presentation` with those steps, a title, and an optional initial mode.
- A local CSS file for the designed visual look, imported by the entry component.

Register a new presentation by adding one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` entry to `src/presentations/index.ts` (or its existing contract-compatible counterpart). Preserve every prior entry and presentation folder. Verify the landing index continues to link to each entry. Never use auto-discovery to replace the explicit registry.

For modification, preserve the identified presentation's stable entities and make only the requested step/entity/style changes. Add or adjust registration only when the requested change requires it. Keep unrelated presentations and infrastructure intact.

Compose one evolving diagram, not independent slide screens. Keep stable IDs for continuing entities so layout projection can morph position, size, label, and emphasis. Adjacent states of the same diagram should share `groupKey` and the same Scene component; change payload rather than remounting the scene. Continuing entities must not be wrapped in newcomer fades. Use presence-aware entrants/exits and delay new arrivals until continuing layout movement settles. Preserve intentional stacking and overlap when readable.

Use the default 880 × 380 canvas and the kit's mode-aware uniform fit geometry. Nodes may use literal coordinates through class/style hooks; raw motion elements with stable `layoutId`s are valid when primitives do not fit. Use kit primitives and Lucide glyph components where useful. Step numbering comes from order, not manually embedded numbers. Every step needs a caption and next/previous navigation.

Keep palette, typography, spacing, borders, shadows, and node/control treatments in presentation or host CSS. Use the kit's stable `data-presentation-*` hooks. Style current progress and table-of-contents controls distinctly from inactive ones while retaining their semantic current-state attributes. Style the bottom-right `data-presentation-attribution` link legibly and intentionally. Do not move presentation aesthetics into the reusable kit or add a default top-left brand. Header branding is an explicit host choice.

## Verify and repair before completion

Run checks from the resolved app directory. `npm test` is for fast unit/contract tests; keep real-browser and filesystem integration tests in their separate scripts.

1. Run `npm run build` for all presentations and the index. Fix type or build errors and rerun affected checks.
2. Run the project-local render verification, for example `npm run verify -- <slug>`, for the created or modified route. It must render at least the first step without console errors or uncaught page errors. Run the full `npm run verify` reference-sample gate before completion where applicable; every sample step must pass. Use `127.0.0.1` consistently for preview binding, readiness probes, and browser URLs.
3. Prefer `npm run inspect -- <slug>` to capture settled per-step screenshots from the production preview using project-local dependencies. Review the first, last, and any dense or key steps. For responsive-sensitive presentations, also capture and review a narrow viewport, for example `npm run inspect -- <slug> 390 844`. The optional positional width and height default to 1440 × 900; captures and `manifest.json` are written under `artifacts/inspection/<slug>/<width>x<height>/`. If the helper is unavailable, write a temporary Playwright helper **under the project root**, resolve local dependencies there, and wait for transitions to settle before capture.
4. Review composition in those screenshots or equivalent browser views: important content must fit the fixed canvas, intended overlaps must remain readable, and scene content must not collide with captions, progress, table of contents, navigation, or attribution. Use `chrome-devtools-axi` for interactive inspection when it is available in the working environment.
5. Review each overlap/chrome/attribution warning against the referenced step. Fix accidental collisions, indistinct current-step controls, and unpolished attribution in presentation/host CSS. Mark only intentional, readable overlapping subtrees with `data-presentation-allow-overlap` on the intended subtree. Do not suppress warnings globally to obtain a clean log. Rerun affected capture/checks after fixes. Screenshots and warnings support visual review; they do not replace build/render pass/fail checks.

Do not report success while a build, render, or visual composition check fails. Repair failures and recheck. Verify preservation diffs and existing registry entries after additions or scoped edits. Keep generated dependencies, build output, and screenshots uncommitted. Stop local preview/browser processes after checks. Report the created/modified route, substantive changes, checks actually run, and any remaining advisory status accurately.

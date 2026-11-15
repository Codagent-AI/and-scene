---
name: presentation
description: Create or modify a browser presentation as one evolving React diagram, bootstrapping a standalone application when needed.
---

# Create an evolving scene

Use this procedure to create or modify a presentation. A presentation is an ordered explanation within one stable diagram, not a sequence of unrelated slide illustrations. `Talk.tsx` is merely the entry filename.

## Gather the request

Ask one question at a time. Collect the topic, visual direction, then each step's content and visual description. Each step needs an era, a one-line presenter title, a paragraph browse caption, and an explanation of what persists, enters, changes, or exits. Do not invent details the user can still provide. If the supplied request already contains these details, proceed directly. Offer to build with partial detail and iterate; when the user chooses that path, do not impose a completeness gate. A complex/key step may benefit from an ASCII sketch for layout confirmation; this is optional, not a requirement for every step.

For modifications, identify the presentation first. If unspecified or ambiguous, list the registry entries and ask which to modify before editing anything. Once identified, ask only about requested step, entity, or style changes. Do not repeat the create interview.

## Resolve the app and scaffold missing contracts

Locate this SKILL.md by its installed path. Resolve `templates/bootstrap/` and `templates/presentation/` relative to this file's directory, never relative to the caller's current directory. The companion `materialize.mjs` resolves bootstrap with `import.meta.url` and can copy a fresh full scaffold: `node <skill-directory>/materialize.mjs <empty-target>`.

Inspect contracts, not formatting or exact filenames:

1. Build: React + Vite + TypeScript and a working `npm run build`.
2. Scene kit: typed Step/Scene contract, persistent grouped host and morphs, present/browse chrome, navigation, fit-scale canvas.
3. Index: an explicit registry mapping independent presentation folders to routes.

Reuse all existing anchors. Extra dependencies, renamed files, or cosmetic changes do not justify replacing them. If all anchors exist, skip scaffolding. If only some exist, copy/integrate only the missing anchors and their dependencies, preserving existing build setup, presentations, routing, and unrelated files. Adapt imports/route integration to existing host contracts rather than overwriting them. The full-copy helper intentionally refuses non-empty targets; perform partial integration using the resolved template files.

Resolve location before writing. An already-existing presentation app takes precedence. For empty/standalone projects use the root. For a monorepo (package.json workspaces, pnpm-workspace.yaml, or packages/apps layout), create a self-contained `presentations/` app without mutating the monorepo root. If a non-empty project lacks kit or index, state the resolved target and wait for explicit user confirmation before any scaffold writes, even if the subdirectory itself is empty. If the user has already authorized that exact target in the session, use that authorization.

Install the complete required set; do not assume packages are installed. Runtime: react, react-dom, motion, lucide-react. Build/dev: vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/node, eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, playwright. The bootstrap also supplies Vitest/jsdom test tooling. Use `npm ci` with an unchanged committed lockfile; after merging dependencies use npm install and retain the resulting lockfile. Make Chromium available with `npx playwright install chromium` if necessary.

Do not add Tailwind, a Tailwind Vite plugin, or another styling framework by default. The scaffold and reusable kit have zero presentation visual defaults. Preserve that boundary when integrating a partial scaffold.

## Create or edit

For creation, copy the presentation template into `src/presentations/<unique-slug>/`, then write the requested narrative, `entities.ts`, typed steps/Scenes, `Talk.tsx`, and presentation-local CSS. Add one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` registry entry. Preserve every other folder and registry entry; verify their registrations remain intact. The landing page enumerates the registry and each slug has its own route. Never put topic-specific content into the kit.

Use stable, presentation-namespaced identities. Group consecutive states of the same diagram with the same `groupKey` and Scene component, updating only payload. Continuing entities must use stable layoutIds without re-entering opacity animation. Use Appear only for newly mounted entities; keep its wrapper keyed and mounted across continuing beats. Its delayed entry starts after layout motion settles. Use AnimatePresence for departures. SceneLayer supports absolute geometry, intentional stacking, and independently mounted layers. Raw motion elements with stable layoutIds are appropriate for custom shapes. Do not spread or flatten intended overlap merely to fit a primitive.

Every step needs id, era, title, caption, payload, and Scene. Numbering is order-derived. Use the generic Presentation boundary without payload casts. Default canvas is 880 × 380; author coordinates within it. Present/browse geometry and navigation belong to the kit.

Own the appearance in local CSS (or host CSS). Plain CSS is the default; use another framework only if the host already uses it or the user requests it. Style all supplied chrome deliberately through `data-presentation-*` hooks: make `[data-presentation-active='true']` visibly distinct; make `[data-presentation-attribution] a` legible (at least 11px) and intentional rather than browser-default. The default attribution is “made by and-scene” linking to the project; top-left branding requires an explicit host opt-in. Do not add kit colors, fonts, borders, cards, button treatments, spacing scales, shadows, or theme tokens.

For modifications, edit only the identified presentation and strictly necessary registration/verification integration. Keep stable identities, existing unrelated content, and other routes intact.

## Verify and repair before reporting success

Run build and a production render check for the created/modified route, at minimum its first step with no console or runtime errors. The supplied driver checks every step: `node scripts/verify.mjs --slug <slug> --no-reference`. The repository's `npm run verify` additionally checks the canonical sample. Use 127.0.0.1 consistently for preview, readiness probes, and browser URLs. Correct type/build, route, browser, or transition failures and rerun the affected checks; never report a failure as success.

Use the project-local helper preferentially: `npm run inspect -- <slug>`. It captures all steps only after transitions settle into `.presentation-artifacts/<slug>/<width>x<height>/` and emits advisory warnings. Review the first, last, and dense/key screenshots in a browser or image viewer for content fitting the canvas, readable intentional overlap, and collisions with captions, progress, ToC, or controls. For responsive-sensitive presentations also run `npm run inspect -- <slug> --width 390 --height 844` and review representative narrow compositions. Use chrome-devtools-axi for interactive inspection where available, starting with a DOM snapshot and then settled screenshots. If no local helper exists, put any temporary Playwright helper under the project root so local dependencies resolve; do not create an external ad hoc script.

Review each overlap/active-state/attribution warning at its cited step. Fix accidental collisions and indistinct active chrome with local layout/CSS. Mark only intentionally overlapping readable subtrees with `data-presentation-allow-overlap`; never blanket-exempt the scene to silence diagnostics. Fix undersized/default attribution locally. Rerun inspection after fixes. Screenshots and warnings support visual review; they are not objective visual pass/fail scores. If visual composition fails, repair and recheck before success.

Before completion confirm: all steps have captions; next/previous, direct jumps, modes and fixed-canvas continuity remain wired; build and render pass; visual review passes; existing presentations remain intact. Report the route, generated/modified files, checks run, and any remaining advisory findings accurately. Do not commit build output, node_modules, or screenshots.

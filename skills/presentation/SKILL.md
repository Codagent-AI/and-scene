---
name: presentation
description: Create or modify a browser presentation as one evolving scene, with a portable React kit and build/render/visual verification.
---

# Presentation

Create an evolving diagram, not independent slides. The generated artifact is a presentation; `Talk.tsx` is merely its entry filename.

## Gather and identify

For a new presentation, gather topic, visual direction, and each beat's content and visual description. Ask one question at a time about missing information instead of inventing details the user can still provide. A complete prompt needs no more questions. Offer the user the choice to proceed with partial detail and iterate; completeness is never a hard gate. Optional ASCII sketches can clarify a key or complex layout without sketching every step.

For modifications, first identify the existing target. If unspecified or ambiguous, list registry entries and ask which presentation before any changes. Once identified, ask only about requested edits to steps, entities, or style. Do not restart the create interview. Preserve all other presentations.

## Resolve infrastructure

Resolve this skill directory from the actual `SKILL.md` path, never from the caller's working directory. `templates/bootstrap/`, `templates/presentation/`, and `tools/scaffold.mjs` are relative to this directory.

Inspect three semantic contract anchors, tolerating cosmetic naming/formatting differences and extra dependencies:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A scene kit with typed Step/Scene, active stage, morphs, navigation, modes, chrome and fixed-canvas fit.
3. A registry mapping presentations to their own routes.

Reuse an existing presentation app when all anchors exist. Add only missing anchors when partially scaffolded; do not overwrite equivalent infrastructure merely because filenames differ. Inspect and adapt integration with existing routes and build entry points. The copy tool cannot recognize arbitrary semantic equivalence: supply its anchor list only after this inspection.

An empty or standalone target scaffolds at its root. A monorepo (`package.json` workspaces, `pnpm-workspace.yaml`, or packages/apps layout) receives a self-contained `presentations/` app. An existing presentation app takes precedence over monorepo signals. In a non-empty project missing the kit or index, state the resolved location and obtain confirmation before writing. Do not treat tool flags as permission from the user.

Preview the plan with `node <skill-dir>/tools/scaffold.mjs <project>`. After confirmation when required, pass `--write --confirmed` and `--anchors=build,kit,index` restricted to missing anchors. The tool rejects conflicting files. For customized scaffolds integrate missing files deliberately, preserving existing anchors and unrelated content. A monorepo's root build anchor is not the self-contained child app's build anchor.

Ensure dependencies rather than assuming they exist: runtime react, react-dom, motion, lucide-react; build/dev vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/node, eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, and playwright. For a full copy run `npm ci`; for partial setups merge required dependencies and scripts without replacing existing entries, install, and update lock data. Install Chromium with `npx playwright install chromium` if unavailable.

The bootstrap is intentionally visually unstyled. Do not add Tailwind or another styling system unless the host already uses it or the user requests it. Do not introduce a default palette, fonts, borders, shadows, spacing scale, cards, buttons, or CSS theme into the kit or bootstrap.

## Generate or modify

Use `templates/presentation/` as a structural guide, replacing topic placeholders. Create `src/presentations/<slug>/entities.ts`, `steps/`, `Talk.tsx` and presentation-local CSS. Add one explicit `{slug,title,load:()=>import('./<slug>/Talk')}` entry to the registry, preserving existing entries and routes. Check the landing page lists it.

Each step has id, era, one-line title, paragraph caption, Scene and typed payload. Numbering comes from order. Use one stable layout-ID namespace. Consecutive states of the same diagram share `groupKey` and Scene so only payload changes. Continuing entities use stable IDs and layout projection; do not wrap them in repeated newcomer fades. Introduced entities enter after continuing movement settles, departing entities exit. Use `Appear` for newly mounted elements and `SceneLayer` for independent absolute layers. Coordinates and raw motion elements with stable layoutId are supported. Keep intentional readable overlap rather than spreading everything to satisfy an implementation pattern.

Presentations own their CSS: color, typography, card/control treatments, spacing, and chrome polish. Style `data-presentation-active` and `aria-current` so progress and ToC distinguish the current step. Style `data-presentation-attribution` to make the default bottom-right “made by and-scene” link legible. Branding in the header is explicit host opt-in. Keep the kit style-neutral. Preserve the 880 × 380 composition and reserve space for captions, navigation and ToC at desktop and narrow sizes.

## Verify and repair

Before reporting completion after creation or modification:

1. Run `npm run build`. Fix type/build failures and rerun the affected check.
2. Run `npm run verify -- <slug>` to render the generated route through all steps in production Chromium (at minimum a first-step render without console/runtime errors is required). The default `npm run verify` also validates the canonical nine-step reference sample. Both preview and browser use 127.0.0.1.
3. Prefer `npm run inspect -- <slug>` over ad hoc browser scripts. The project-local helper captures settled per-step screenshots and reports advisory warnings. If unavailable, write any temporary Playwright helper inside the project root so local dependencies resolve.
4. Review first, last, and dense/key step screenshots or equivalent browser views; also capture/review a narrow viewport for responsive-sensitive compositions (`npm run inspect -- <slug> --width=390 --height=844`). Confirm important content fits the fixed canvas, intentional overlaps stay readable, and no scene text collides with captions, ToC, progress or navigation. Warnings are guidance, never proof of visual quality.
5. Review every overlap/active-state/attribution warning at the referenced steps. Fix accidental collisions, indistinct active chrome, and illegible attribution in local CSS. Treat a `text too small` warning at a narrow viewport as a readability failure of the scaled canvas: enlarge the smallest scene text or simplify the dense step rather than ignoring it. Mark only intentionally readable overlapping subtrees with `data-presentation-allow-overlap`; never mark the whole scene just to silence diagnostics. Recheck after fixes.

Do not report success while build, render, or composition checks fail. Repair them and repeat affected checks. Report actual checks and any remaining advisory status accurately. Preserve existing presentations and scoped modifications throughout.

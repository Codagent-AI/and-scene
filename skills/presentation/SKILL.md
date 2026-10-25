---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with a reusable React scene kit and local verification.
---

# Presentation

Use this procedure to turn a topic into one scene evolving through named steps, or to edit an existing presentation. A presentation is not a sequence of unrelated slides. `Talk.tsx` is only the entry filename.

## Gather and identify

For a modification, inspect the registry first. If the target is unspecified or ambiguous, list the existing presentations and ask which to modify **before editing anything**. After identifying it, ask only about the requested steps, entities, or style. Do not restart the create interview.

For creation, collect topic, visual style, and each step's content and visual description, including what persists, enters, exits, and morphs. Ask for missing details **one question at a time**. Never invent details the user can still provide before asking. A complete prompt can proceed immediately. The user controls depth: explicitly choosing to proceed with partial detail is enough; do not enforce a completeness gate. Optionally show an ASCII mockup for a key or complex layout, without requiring one for every step.

## Resolve the app and scaffold only missing contracts

Resolve `templates/bootstrap/` and `templates/presentation/` from the directory containing **this SKILL.md**, never from the caller's working directory. The sibling `bootstrap.mjs` also resolves its snapshot with `import.meta.url`.

Inspect contracts, not filenames, formatting, or byte identity. Record which anchors exist:

1. Working Vite + React + TypeScript build (`npm run build`).
2. Scene kit with Step/Scene types, host/stage morphs, navigation/modes, captions, era ToC, and fit-scale canvas.
3. Presentation registry mapping multiple presentations to their own routes.

If inside an existing presentation app, use it and repair only missing anchors. All present means no scaffolding. None present means full scaffolding. Some present means preserve those contracts and add only missing anchors and dependencies. Cosmetic differences or extra dependencies never justify replacement. Preserve unrelated files and existing routes.

Otherwise detect monorepos from `package.json` workspaces, `pnpm-workspace.yaml`, or an `apps/` or `packages/` layout: create a self-contained app under `presentations/`. Standalone and empty targets scaffold at root. In a non-empty project lacking the kit or index, **state the exact proposed target and wait for user confirmation before writing**. Explicit prior authorization for that target counts; do not request it twice.

The bootstrap helper is a conservative copier, not an anchor detector. After contract inspection and any required confirmation, invoke:

```sh
node <absolute-skill-directory>/bootstrap.mjs <resolved-app-directory> build,kit,index
```

Pass only missing anchor names. It refuses conflicting files before copying. For equivalent anchors with different names adapt imports without overwriting the existing anchor. If adding the index to an app with a router, integrate the explicit registry and routes with its router rather than overwrite its main entry. Merge package dependencies and necessary scripts into the existing package manifest, preserving unrelated configuration; the helper merges dependencies, only adds absent scripts and does not overwrite existing files. If an existing build script cannot compile the new kit, fix its integration without replacing the build contract.

Install the complete required set, without assuming any are installed: runtime `react`, `react-dom`, `motion`, `lucide-react`; development `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack (`eslint`, `@eslint/js`, `typescript-eslint`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`), and `playwright`. Use `npm install` after a dependency merge and commit updated lock data, or `npm ci` for the untouched bootstrap lock. Run `npx playwright install chromium` if necessary.

The scaffold and kit intentionally have **zero presentation visual defaults**. Do not add Tailwind, its plugin, colors, fonts, spacing scales, card/button treatments, borders, shadows, or theme tokens to them. Plain CSS owned by each presentation is the default. An existing host framework or an explicit user request may change the presentation's styling approach, never the kit's dependency contract.

## Create or modify

Copy the presentation template into a new `src/presentations/<slug>/` folder; replace all placeholder names and metadata. Give every entity a presentation-local stable namespace in `entities.ts`. Write typed Step objects in `steps/`, with id, era, one-line title, paragraph caption, Scene, payload and optional groupKey. Number from array order. Use the generic primitives or raw motion elements with stable layout IDs for coordinate-heavy art.

For successive states of one diagram, share both Scene and groupKey and change only payload. Keep continuing entity instances and IDs stable; never replay newcomer animation on an existing entity. Wrap newcomers in Appear only at their actual entry and use AnimatePresence for exits. Preserve readable intentional stacks/overlaps. The fixed canvas is 880 × 380 and scales uniformly; do not reflow entities responsively.

Render `<Presentation steps={STEPS} title="…" initialMode="browse" />` in `Talk.tsx`. Keep visual CSS in that presentation folder or the host. Style stable `data-presentation-*` hooks: current progress/ToC must be visibly distinct; navigation and bottom-right attribution must be legible and intentional. Kit attribution defaults to the and-scene GitHub link; top-left branding is host opt-in.

Add one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` registry entry. Preserve all existing entries and presentation folders. New presentation is reachable at `/<slug>` and listed on `/`. For modifications, edit only the identified presentation and necessary registry/verification integration; preserve every unrelated presentation and route.

## Verify and repair before reporting success

Run `npm run build`, then `npm run verify -- <slug>` (production Chromium check of every step; at minimum first-step render with no runtime or console errors). In this repository also run default `npm run verify` to enforce the canonical nine-step reference sample. The bootstrap's unstyled `example` route can be smoke-checked with `npm run verify -- example`. Fix type/build, runtime, console or navigation failures and rerun affected checks; never report broken output as success.

Use the project-local helper `npm run inspect -- <slug>` for settled per-step desktop screenshots and advisory diagnostics. Prefer it over ad hoc scripts. If absent, put any temporary Playwright helper **under the project root** so local dependencies resolve. Review first, last and dense/key steps in screenshots or equivalent browser views; also inspect a narrow viewport for responsive-sensitive presentations. With AXI available, start with `snapshot`, then use screenshots for composition. Confirm important content fits the canvas, intended overlaps remain readable, and text avoids caption, ToC, progress and navigation collisions.

Review every overlap, indistinct-active or attribution warning at its cited step. Fix accidental collisions and locally style active chrome/attribution. Mark only genuinely intentional, readable overlaps with `data-presentation-allow-overlap` on the smallest appropriate subtree; never silence accidental problems. Rerun inspection after repairs. Warnings and images are advisory review artifacts, not an automated aesthetic pass/fail gate. Fix failed visual composition before claiming success.

Report route, generated/modified files, build/render checks, composition views reviewed, and remaining advisory status accurately. Respect a caller's stricter testing boundary: if manual inspection is prohibited, record visual composition as unverified and leave it to independent acceptance; do not claim that automated screenshots establish visual quality.

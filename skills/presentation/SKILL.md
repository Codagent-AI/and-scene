---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagrammatic scene (stable entities moving through named steps). Use when asked to make a presentation, talk, or explainer from a topic, or to change an existing one. Bootstraps the Vite/React/TypeScript scene kit when it is missing.
---

# Presentation

Build presentations as **one evolving scene**: entities keep a stable identity and morph, enter or leave from step to step. They are not independent slides. "Presentation" is the canonical term; "talk" is informal only (the entry component file is `Talk.tsx`).

All paths below are relative to this `SKILL.md`'s own directory (`<skill>`), never your working directory. The helper is `<skill>/scripts/scaffold.mjs`; it resolves `templates/bootstrap/` and `templates/presentation/` from its own location.

## 1. Gather

Ask the user **one question at a time**. Never assume what the user can still tell you.

1. The topic.
2. The visual style (palette, mood, type; plain CSS by default).
3. For each step: its content, plus a visual description of what is on screen (which entities appear, move, connect, re-label, leave).

- If the prompt already contains the topic, style and every step, skip the questions and build.
- If details are missing, ask for them. If the user chooses to build with only some details, build from what you have without a completeness gate, then iterate.
- For a key or complex step you may draw an ASCII mockup and confirm the layout before building. Do this selectively, not for every step.

## 2. Resolve the target and scaffold

Run `node <skill>/scripts/scaffold.mjs plan <project-dir>`. It reports contract-level detection of the three anchors, the resolved target, and whether confirmation is required:

1. **Build setup**: a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit**: the presentation-agnostic engine (the `Step`/`Scene` contract, stage with entity morphs, present/browse navigation, chrome, fit-scale canvas).
3. **Presentation index**: a registry mapping each presentation to its own route.

Detection keys on what the files do, so renamed or reformatted equivalents and extra dependencies do not trigger re-scaffolding.

Target resolution: an existing presentation app (kit or index present, in the project, a parent, or `presentations/`) is reused. A monorepo (`workspaces`, `pnpm-workspace.yaml`, or `packages/` / `apps/`) gets a self-contained app in `presentations/`, never at the monorepo root. Otherwise scaffold at the root.

- **All three anchors present**: skip scaffolding and go to step 3.
- **Missing anchors**: scaffold only those, without disturbing present ones, and install dependencies (never assume React, Vite, TypeScript, Motion, Lucide, ESLint or Playwright are installed): `node <skill>/scripts/scaffold.mjs apply <project-dir> --install`.
- **Non-empty project** (anything besides version-control metadata): first tell the user the target location and the missing anchors, and **wait for confirmation** before any write. Then add `--confirmed`. `apply` refuses without it. An empty directory needs no confirmation.
- The scaffold is style-neutral: no Tailwind, theme, default colors, fonts, cards or buttons. Add a styling framework only if the host already uses one or the user asks for it.

## 3. Create or modify

**Create**: `node <skill>/scripts/scaffold.mjs new <project-dir> --slug <slug> --title "<Title>"` adds `src/presentations/<slug>/` (`entities.ts`, `Scene.tsx`, `steps.ts`, `Talk.tsx`, `presentation.css`) and one registry line, leaving existing presentations untouched. Then replace the template content with the gathered steps.

- Model each step with `id`, `era`, `title` (one line), `caption` (paragraph) and a diagram state. Adjacent steps that are successive states of one diagram share a `groupKey` and `Scene`, so the Scene stays mounted and only `payload` changes.
- Name entities in `entities.ts`; a persisting entity keeps the same `entity` id. Wrap only newcomers in `Appear` inside `Presence`; never wrap continuing entities. Keep intentional overlaps and stacking.
- Style in the presentation's own CSS (`presentation.css`) via the `data-presentation-*` hooks: `-box`, `-label`, `-arrow`, `-frame`, `-emphasis`, `-symbol-chip`, `-header`, `-marker`, `-title`, `-caption`, `-footer`, `-progress`, `-toc-entry`, `-prev`, `-next`, `-attribution`. Active chrome is `[data-presentation-active="true"]` / `aria-current="step"`. Give the active progress dot and ToC entry a visibly different style and make the attribution legible (at least 11px, not the browser-default link). Mark an intentional, readable overlap with `data-presentation-allow-overlap` on its subtree, and nothing else.
- Never add styles to `src/presentation-kit/`.

**Modify**: if the target is unspecified or ambiguous, list the registered presentations (`src/presentations/index.ts`) and ask which one before changing anything. Once identified, ask only about the requested changes (steps, entities or style) and edit that presentation in place. Do not re-run the create interview or touch other presentations.

## 4. Self-verify before reporting done

Do not report success until all of these pass, fixing and rechecking on any failure:

1. `npm run build` has no type errors.
2. The render check: the presentation's route renders its first step with no runtime or console errors (`npm run verify` also steps through every step of the reference sample).
3. A visual composition check. Prefer the project-local helper `npm run inspect -- <slug>` (screenshots in `inspection/<slug>/step-NN.png`, captured after animations settle; add `--narrow` for responsive-sensitive presentations). If it is missing, write any temporary Playwright script under the project root so local dependencies resolve. Look at the first step, the last step and dense or key steps, using the browser view or the screenshots. Confirm important content fits the 880 × 380 canvas, intentional overlaps stay readable, and nothing collides with captions, progress, ToC or navigation.
4. Review every advisory warning the helper prints: fix accidental collisions and indistinct current-step chrome, polish the attribution through its hook, and mark only genuine, readable overlap as allowed. Rerun after fixes.

Quality bar for every presentation: builds clean, renders step one without errors, has a caption per step, supports next/previous, conforms to the evolving-scene model, and passes the visual check.

---
name: presentation
description: Create, scaffold, style, verify, inspect, or modify an evolving browser presentation in a new or existing React app. Use when asked to make a presentation, talk, explainer, visual walkthrough, or step-by-step scene; when adding or changing presentation steps, entities, routes, or presentation styling; or when bootstrapping the And Scene presentation kit.
---

# Create or modify a presentation

`<skill-dir>` below is the directory containing this `SKILL.md`. Resolve every template, script, and reference path relative to the directory containing this `SKILL.md`, never the user's current working directory.

## Gather the story

Ask in this order, one question at a time, waiting for each answer: the topic (if missing), the visual style, then the content and visual description of each step. Do not assume details the user can still provide.

Stop asking as soon as either condition holds:
- The user says to build with partial detail. Proceed with what they gave and iterate; there is no completeness gate.
- The prompt already gives the topic, style, and all step details. Proceed without questions.

Offer a small ASCII mockup only for key or complex steps when it would clarify composition. Do not mock up every step.

## Resolve the target and scaffold

1. Run `node <skill-dir>/scripts/detect-target.mjs <project-dir>`.
2. Read these fields from its JSON output (see [references/detect-target-output.md](references/detect-target-output.md)): `anchors` (`build`, `kit`, `index`), `missing`, `empty`, `target.kind`, and `target.dir`. The three app anchors are detected by contract, not byte identity: a Vite + React + TypeScript app with a working `npm run build`; a scene kit (Step/Scene contract, stage/host, navigation, chrome, fit-scale canvas); and a presentation index mapping each presentation to its route.
3. Branch on the result, checking the rows in order and taking the first match. `<app-dir>` is `target.dir`:

| Order | Condition | Action |
| --- | --- | --- |
| 1 | `missing` is empty (whatever `target.kind` is) | Skip scaffolding |
| 2 | `empty` is true | `node <skill-dir>/scripts/scaffold.mjs --target <app-dir> --anchors all` |
| 3 | `target.kind` is `monorepo` and `missing` is not empty | Scaffold a self-contained app under `presentations/` (`target.dir`, `<project-dir>/presentations/`), not the repo root: `node <skill-dir>/scripts/scaffold.mjs --target <app-dir> --anchors <comma-separated missing anchors>` |
| 4 | Any other case (`missing` is not empty) | `node <skill-dir>/scripts/scaffold.mjs --target <app-dir> --anchors <comma-separated missing anchors>`, e.g. `--anchors kit,index` |

4. In a non-empty project that lacks the scene kit or presentation index, state the exact target location and proceed only after the user confirms. Never overwrite existing files or disturb unrelated content.
5. After scaffolding, run `npm install` in `<app-dir>`. `scaffold.mjs` merges the dependency set declared in `<skill-dir>/templates/bootstrap/package.json` into any existing `package.json`; do not assume packages are already installed.
6. Do not add Tailwind or another styling framework unless the host already uses it or the user explicitly requests it. Use presentation-local plain CSS by default. The kit has no default theme.

## Create a presentation

1. Run `node <skill-dir>/scripts/new-presentation.mjs --target <app-dir> --slug <slug> --title <title>`. It copies `<skill-dir>/templates/presentation/` into `src/presentations/<slug>/` (`entities.ts`, `steps/*`, `Talk.tsx`, CSS) and adds an explicit `{ slug, title, load: () => import('./<slug>/Talk') }` entry to `src/presentations/index.ts`. The route is `/<slug>`. Existing presentations stay intact.
2. Replace the template content with the user's story. Model one evolving scene: keep entity IDs and `layoutId`s stable across steps, group successive steps that share a scene, add newcomers with `Appear`, and let continuing entities morph. The step and node contract is in [references/kit-contract.md](references/kit-contract.md); the DOM hooks are in the scaffolded `src/presentation-kit/README.md`.
3. Keep all visual choices in presentation or host CSS, never in the kit. Style the active progress/ToC entry visibly using `[data-active="true"]` and/or `[aria-current]`. Style `[data-presentation-attribution]` locally at a legible size of at least 12px. Use `data-presentation-allow-overlap` only for genuinely intentional, readable overlap.

## Modify a presentation

If the target is missing or ambiguous, read `src/presentations/index.ts`, list its existing presentations, and ask which one to change before editing anything. Then ask only about the requested step, entity, or style changes. Make scoped edits to that presentation; do not repeat the create workflow or touch unrelated presentations.

## Verify before reporting done

1. Run `npm run build`. A lighter single-route/first-step check is allowed first, but it does not replace full verification.
2. Confirm the first step renders without runtime or console errors, every step has a caption, and next/previous navigation works.
3. Run `npm run inspect -- <slug>` from the project. Review the settled screenshots for the first, last, and dense or key steps, and check a narrow viewport when the composition is responsive-sensitive. Review overlap, active-nav, and attribution warnings: fix accidental collisions, indistinct active chrome, and unpolished attribution, then rerun inspection. Mark only intentional readable overlaps.
4. Run `npm run verify` for the full route and step render check.
5. Never report success while build, render, or visual checks fail. Fix the problem and re-check.

Quality bar: a clean build, a working first step, a caption for every step, working next/previous navigation, and a composition that fits without accidental collisions.

Report completion in this form:

```
Presentation: <slug> at /<slug>
Checks: build <pass|fail>; inspect <pass|fail>; verify <pass|fail>
Steps inspected: <step numbers and viewports>
Advisory warnings: <remaining warnings, or none>
```

## Out of scope

- PowerPoint, Keynote, PDF, or image export.
- Hosts that are not Vite + React + TypeScript.
- Choosing a visual theme inside the kit; styling belongs to the presentation or host.
- Editing presentations the user did not ask to change.
- Hosting or publishing.

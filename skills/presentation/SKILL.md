---
name: presentation
description: Creates and modifies browser-based, evolving-scene presentations with the And Scene kit. Activates when users ask to create a presentation, build a slide deck, add or revise presentation steps, or mention "And Scene" or a browser presentation.
---

# And Scene presentation skill

Create a presentation as one evolving diagrammatic scene: durable entities keep their IDs and positions while steps add, remove, or transform them. A presentation is a self-contained folder plus one explicit registry entry; it is never a loose collection of unrelated slides.

## Resolve the skill assets first

Set `SKILL_DIR` to the directory containing this `SKILL.md`. Resolve every asset from that directory, never from the current working directory:

- bootstrap: `$SKILL_DIR/templates/bootstrap/`
- new presentation: `$SKILL_DIR/templates/presentation/`
- new step: `$SKILL_DIR/templates/step/`

This makes the skill distributable and safe to invoke from any project directory.

## Gather, one question at a time

Classify the request as **create** or **modify**. Do not ask questions that the request already answers.

For create, ask one question at a time, in this order:

1. Ask for the topic if it is missing.
2. Ask for the visual direction (mood, palette, typography, and any reference) if it is missing.
3. Ask for the first story beat: its present title, browse caption, and visual intent.
4. Ask one question at a time for each next beat, including what persists or changes from the previous scene.

Offer an explicit option to proceed with partial detail after the topic and after any beat. Never invent details the user can still provide, but when they choose partial detail, use captured material and label reasonable authoring choices as such. For a crucial or dense layout, an optional small ASCII mockup may help:

```text
[ enduring entity ] ──> [ new entity ]
         \                 caption cue
          +── [ changed entity ]
```

For modify, identify the presentation before editing. If the target is absent or ambiguous, list the registered `slug — title` options and ask one question identifying it. Then ask only about the requested steps, entities, or style changes; do not re-run create gathering.

## Resolve target and scaffold contract anchors

Inspect the candidate app for three **contract anchors**, rather than matching filenames or formatting:

1. A Vite + React + TypeScript build with a working `npm run build`.
2. A presentation-agnostic scene kit with the typed `Step`/`Scene` contract, active-step host and morphs, present/browse navigation and chrome, and a fit-scale canvas.
3. An explicit presentation registry mapping routes to independently loaded presentation folders.

Determine the target:

- Empty directory or standalone project: repository root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or `apps/` or `packages/`): a self-contained `presentations/` app.
- Existing app with anchors: use that app; only fill missing anchors.

In a non-empty project missing an anchor, state the exact target path and obtain confirmation before writing. Preserve unrelated project files and existing presentations. If all anchors exist, do not scaffold or replace them.

For a full scaffold, copy `templates/bootstrap/` into the target. For a partial scaffold, copy only the missing anchor and its direct supporting files, retaining compatible host setup. Ensure (do not assume) these packages are installed in the target: `react`, `react-dom`, `motion`, `lucide-react`, `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack, and `playwright`. Do not add Tailwind or any styling framework unless the host already uses it or the user asks for it.

The reusable kit stays style-neutral: no required colors, fonts, spacing scale, cards, buttons, borders, shadows, or theme tokens. Add a plain CSS file owned by the presentation for its actual visual design, including visibly distinct active chrome and a legible attribution.

## Create a presentation

1. Derive a stable lowercase slug and create `src/presentations/<slug>/`.
2. Materialize `entities.ts`, `steps.tsx`, `Talk.tsx`, and `presentation.css` from the presentation templates. Use the step template for additional scene beats.
3. Give each semantic visual object a stable layout ID namespaced by the slug. Adjacent related steps use the same `groupKey`; enduring objects preserve their layout IDs. Use `Appear` only for genuinely new objects after continuing motion settles.
4. Add a single explicit registry entry in `src/presentations/index.ts`: `{ slug, title, load: () => import('./<slug>/Talk') }`. Never replace or glob-import existing entries.
5. Keep visual CSS under the presentation folder (or an already-existing host styling system), not under `src/presentation-kit/`.

## Modify a presentation

Change only the selected presentation's entities, steps, local CSS, and any necessary registry metadata. Preserve every other presentation and route. If a request changes one beat, retain the surrounding IDs, `groupKey`, title/caption contract, and scene continuity unless the user requested otherwise.

## Verify before reporting success

Fix failures; never report completion while a check fails.

1. Run `npm run lint` and `npm run build` in the presentation app.
2. Run the project-local render check where present: `npm run verify -- <slug>`. At minimum, open the generated route in a real browser and verify the first step has no runtime or console errors, a caption, and previous/next navigation.
3. Prefer the project-local screenshot helper: `npm run inspect -- <slug>`. Inspect settled screenshots for the first, last, and dense or visually important steps. Also inspect a narrow viewport when the layout is responsive-sensitive.
4. Review warnings. Fix accidental text/chrome collisions, indistinct active progress or table-of-contents state, and missing/browser-default/undersized attribution. Mark only deliberate, readable overlaps with an explicit `data-presentation-allow-overlap` marker, then rerun inspection.

Use this exact completion report:

```text
Route: /<slug>
Files changed: <comma-separated paths>
Assumptions: <captured partial details or "none">
Checks passed:
- PASS — npm run lint
- PASS — npm run build
- PASS — npm run verify -- <slug>
- PASS — npm run inspect -- <slug> (steps inspected: <first, dense, last; narrow if applicable>)
Warnings remaining: <"none" or an intentional, readable overlap with its marker>
```

## Out of Scope

This skill creates browser-based evolving scenes only. It does not create PowerPoint, Keynote, PDF, video, image-export, or unrelated independent-slide deliverables; use an export/presentation-format skill when one is available, otherwise ask the user to choose a browser presentation or a different workflow. It also does not provide a visual editor, publish presentations, or redesign the reusable kit as a host design system.

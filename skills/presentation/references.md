# Presentation skill reference

## Step and kit API

A `Step<TPayload>` contains `id`, `era`, `title`, `caption`, optional `groupKey`, `payload`, and `Scene`. The `Scene` receives `payload`, `step`, and order-derived `stepIndex`. Adjacent states of one persistent diagram share `groupKey` and the same scene component. `Box` and `Label` require `entityId` for stable layout projection; other primitives expose the same entity identity pattern. Kit exports are collected in `src/presentation-kit/index.ts` (and its bootstrap snapshot).

## Stable browser hooks

- Root and state: `[data-presentation]`, `data-presentation-mode`, `data-step-count`, `data-step-index`.
- Diagram: `[data-presentation-stage]`, `[data-presentation-canvas]`, `[data-presentation-scene]`, `[data-presentation-node]`, `[data-entity-id]`.
- Narration and controls: `[data-presentation-caption]`, `[data-presentation-step-title]`, `[data-presentation-present-title]`, `[data-presentation-progress]`, `[data-presentation-step]`, `[data-presentation-toc]`, `[data-presentation-toc-item]`, `[data-presentation-previous]`, `[data-presentation-next]`, `[data-presentation-mode-toggle]`.
- Styling/state: active progress and TOC entries expose `data-presentation-active="true"` and `aria-current`.
- Attribution: `[data-presentation-attribution]`.
- Intentional readable overlap exemption: add `data-presentation-allow-overlap` to the smallest overlapping subtree.

## Screenshot helper warnings

The project-local inspection helper captures settled steps and reports advisory warnings for unmarked visible text/chrome collisions, canvas overflow, visually indistinct active progress or TOC state, and missing, browser-default, or undersized attribution. Warnings identify the step and relevant elements. The overlap exemption suppresses collision warnings only within its marked subtree; it does not exempt fit or chrome checks.

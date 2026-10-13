---
name: presentation
description: Create, scaffold, verify, or modify browser presentations built as evolving scenes. Use when asked to make a presentation, visual explainer, diagram talk, or to update an existing presentation.
---

# Presentation skill

Create one browser presentation as a continuous scene that changes through named steps. Read the host project before editing and keep each presentation self-contained.

## 1. Gather the brief

Ask one question at a time for any missing information: topic, visual style, then the content and visual description for each step. Skip questions already answered by the prompt. The author may proceed with partial detail; use what is known and leave room to iterate rather than imposing a completeness gate. Use an ASCII mockup only when a key or complex layout would benefit from confirming its arrangement.

## 2. Resolve the app and scaffold

Treat these as the three contract anchors: (a) a Vite + React + TypeScript build setup, (b) a scene kit with the `Step`/`Scene` contract, stage, navigation, chrome, and fit-scale canvas, and (c) a presentation index/route registry. Detect each by its presence and behavior, not matching a template byte-for-byte. Reuse complete anchors and scaffold only missing pieces.

Resolve the target in this order:

1. If already inside an app with the anchors, work there.
2. In a monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout), use a self-contained app under `presentations/`.
3. Otherwise use the project root (including an empty directory).

In a non-empty project that needs scaffolding, state the target path and wait for confirmation before writing. Find templates relative to this `SKILL.md` file, never relative to the caller's working directory: `templates/bootstrap/` for the app and `templates/presentation/` for a presentation. Install the full declared dependency set even if some packages appear installed: React, React DOM, Motion, Lucide, Vite, the React Vite plugin, TypeScript and React/Node types, ESLint stack, and Playwright. Preserve existing project dependencies and scripts. Do not add Tailwind or another styling framework unless the host already uses it or the author requests it. The kit and blank scaffold have no presentation theme defaults.

## 3. Create or modify

For a new presentation, choose a URL-safe unique slug and add one directory under `src/presentations/<slug>/` containing `entities.ts`, `steps/`, `Talk.tsx`, and presentation-owned plain CSS. Add exactly one explicit registry entry; leave existing presentations intact. Follow `templates/presentation/` and its `PLACEHOLDERS.md` convention. For a modification, list presentations and ask which one if the target is unclear; once identified, ask only about the requested changes and edit that presentation in place.

Build a narrative of named states in one evolving diagram. Keep entity IDs stable across steps when an entity persists, group steps that update the same scene instance, and use the generic kit primitives. Every step needs a title and caption. Keep colors, typography, spacing, component treatment, and CSS in the presentation or host, not the kit. Style active navigation so it is visibly distinct and make attribution readable (at least an 11px font and 24px hit area). Mark overlap with `data-presentation-allow-overlap` only when it is intentional and remains readable.

## 4. Verify and inspect

Run `npm run build` and verify the route renders its first step without runtime or console errors. Inspect browser composition for the first, last, and dense/key steps; also inspect a narrow viewport when responsive-sensitive. Prefer `npm run inspect -- <slug>` when available. It writes settled screenshots under `.presentation-inspection/<slug>/` and reports advisory warnings. Otherwise create any temporary Playwright helper inside the project root. Review every warning, fix accidental collisions or indistinct active chrome/attribution, and rerun checks. Never report success while a required check fails; report any remaining advisory warnings accurately.

The quality bar is: clean TypeScript build, error-free first render, a caption and working next/previous navigation for every step, a coherent composition within the fixed canvas and clear of chrome, and stable-entity evolving-scene behavior. Full per-step render verification may be available through `npm run verify`; run it when present.

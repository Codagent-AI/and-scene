---
name: presentation
description: Creates or modifies routed React presentations built as one evolving diagrammatic scene. Triggers when users ask to 'create a presentation,' 'modify a presentation,' build a 'React presentation,' or animate entities across presentation steps.
---

# Presentation

Use this skill to create and modify routed React presentations. A presentation is
one evolving scene: entities retain stable identities between named steps and
move, enter, or leave in place. Do not generate a stack of independent slides.

## Out of Scope

This skill does not create conventional independent-slide decks, PowerPoint,
Keynote, PDF, or image exports, and it does not apply to unrelated React UI or
document-generation work. Use a format-specific export or document workflow when
those deliverables are required.

## Locate this skill and its templates

Set `SKILL_DIR` to the directory containing this `SKILL.md`. Resolve every
template from `SKILL_DIR/templates/`, never from the caller's current directory:

```text
SKILL_DIR/
  SKILL.md
  templates/bootstrap/
  templates/presentation/
```

`templates/bootstrap/` is a complete, standalone Vite + React + TypeScript
application. Its scene kit is a release snapshot. Keep its
`src/presentation-kit/` byte-aligned with the canonical kit when updating either
one. `templates/presentation/` is copied into a presentation folder and then
given the requested slug, entities, steps, and local styling.

## 1. Determine whether this is create or modify

If the request says to modify a named presentation, inspect the presentation
index and that presentation's files. Ask only about the requested edits (steps,
entities, narration, or local visual style); do not repeat create-flow questions.

If modification is requested without an unambiguous target, list the registered
presentations and ask which one to edit. Do not change files until it is named.

Otherwise, use the create flow below.

## 2. Gather a create brief, one question at a time

Do not invent information the user can still provide. Ask only one question per
turn, in this order, skipping a question only when the prompt already answers it:

1. “What is the presentation topic and its intended audience?”
2. “What visual direction should it have (palette, typography, tone, or useful
   references)?”
3. For each beat: “What should this step say, and what should the scene visibly
   show or change?”

Record a stable step id, era/section, one-line presenter title, browse caption,
and a visual state for every answered beat. For a key or complicated composition,
offer a compact ASCII mockup before implementation, for example:

```text
you ── question ── skill
                  │
             [step tray]
```

The user controls detail. After any useful amount of information, explicitly
offer to build from the captured partial brief. If they choose that option,
generate sensible connective details only where required to make the scene work,
and identify those details in the completion summary. A complete prompt may go
straight to implementation.

## 3. Resolve anchors and the scaffold target

Check for these contracts rather than comparing files byte-for-byte:

1. **Build setup:** a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit:** `Step`/`Scene` types, stage and morph host, present/browse
   navigation and chrome, and fixed-canvas fit scaling.
3. **Presentation index:** a registry mapping presentations to routes.

Treat a project as a monorepo when its `package.json` has `workspaces`, it has a
`pnpm-workspace.yaml`, or it has `packages/` or `apps/`. Use these targets:

| Context | Target |
| --- | --- |
| Empty directory or standalone project | repository root |
| Monorepo | `presentations/` as a self-contained app |
| All three anchors already exist | existing presentation app |

For a non-empty project missing any anchor, state the exact target and ask for
confirmation before writing. For an empty directory, proceed at root. In a
partial scaffold, preserve existing working anchors and add only the missing
ones; do not replace unrelated project setup or existing presentations.

When a full scaffold is required, copy `templates/bootstrap/` into the resolved
target. For a partial scaffold, copy only the corresponding bootstrap files.
Install all required dependencies instead of assuming they exist:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build/development: `vite`, `@vitejs/plugin-react`, `typescript`,
  `@types/react`, `@types/react-dom`, `@types/node`, ESLint and its React/
  TypeScript plugins, and `playwright`.

Do not add Tailwind, a Tailwind Vite plugin, or another styling framework unless
the host already uses one or the user explicitly requests it. The kit must remain
style-neutral: no palette, font, spacing scale, visual card/button treatment,
border, shadow, or theme token belongs in `src/presentation-kit/`.

## 4. Create or edit the presentation

For a new presentation:

1. Make `src/presentations/<slug>/` by copying `templates/presentation/`.
2. Replace template placeholders and write `entities.ts` with a presentation-
   local namespace of stable layout ids.
3. Write one or more typed `steps/*.tsx` modules. Steps in an evolving sequence
   share a `groupKey` and Scene component; their payload changes in place.
4. Compose only generic kit primitives (or raw motion elements with stable
   `layoutId`s where appropriate). Use stable ids for continuing entities and
   `Appear` only for genuine newcomers.
5. Keep colors, typography, spacing, card/button treatments, chrome polish, and
   attribution readability in the presentation's own plain CSS by default.
6. Add exactly one explicit registration in `src/presentations/index.ts`; retain
   every existing registration and route.

For a modification, edit only the selected presentation and necessary local
assets/styles. Do not regenerate other presentations, reorder the registry, or
walk the entire brief again.

Every step needs an id, era, title, caption, Scene, and payload. Verify that the
presentation has next/previous navigation through the kit, captions in browse
mode, stable active chrome, and legible locally styled attribution.

## 5. Verify and repair before reporting completion

Run all applicable checks from the resolved presentation-app root:

```bash
npm run build
npm run verify -- <slug>
npm run inspect -- <slug>
```

If a project has not yet supplied `npm run verify`, run the build and the
bootstrap template's local `scripts/verify.mjs` smoke check, then use
`scripts/inspect-presentation.mjs`. Keep temporary browser helpers inside the
project root if the local helper is unavailable.

Do not report success after a build, browser, console, page-error, route, or
transition failure. Fix it and rerun the failing check followed by the full
verification sequence. Inspect settled screenshots for the first step, final
step, and dense/key steps; inspect a narrow viewport when the composition is
responsive-sensitive. Review every inspection warning: fix accidental overlap,
indistinct active progress/ToC state, and browser-default/undersized attribution.
Use `data-presentation-allow-overlap` only for intentional, readable overlap.

In the completion report, state the target route, presentation files changed,
scaffold decision, checks run, inspected steps/viewports, and any partial-brief
assumptions. Do not describe a presentation as complete until these checks pass.

---
name: presentation
description: Create or modify browser presentations, slide decks, talks, or visual explainers as one evolving scene using the local scene kit. Use when a user asks for a presentation, slides, a deck, a talk, or a change to an existing presentation.
---

# Presentation skill

Create a browser-based presentation as one scene that evolves through named steps. Keep the scene kit reusable and style-neutral; put visual design in the presentation.

## Out of scope

- PowerPoint, Keynote, PDF, and image exports: say these exports are not provided by this workflow and suggest using browser printing or a dedicated export tool.
- A visual editor, hosting service, or general-purpose design system: explain that this workflow creates local browser-based React presentations and offer to build or modify one.
- Adding presentation infrastructure inside an unrelated framework: scaffold a self-contained React app at the resolved target instead of claiming the unrelated app is supported.

## 1. Understand the request

Decide whether this is a new presentation or a change to an existing one. Use information already in the request; do not ask again for details it supplies.

For a new presentation, collect missing information one question at a time:

1. Topic and intended audience or takeaway.
2. Visual style (or permission to choose one).
3. Step sequence, with the idea communicated and intended visual arrangement for each step.

Ask the next missing question only after receiving the previous answer. Offer the user the choice to proceed with partial details at any point. If they choose that, build from captured information and label unresolved choices as your own design decisions. Do not impose a completeness gate. An ASCII sketch can clarify a particularly complex or central composition; use it selectively, not for every step. When the request already provides the topic, style, and steps, proceed without questions.

For a modification, identify the target presentation first. If the request does not name a unique target, list registered presentations and ask which one. Once identified, ask only about the requested change; do not repeat the creation interview.

## 2. Find the app and resolve scaffolding

Work in the user's repository. Resolve this skill's templates from the directory containing this `SKILL.md`, never from the shell's current working directory. For example, treat `templates/bootstrap/` and `templates/presentation/` as paths relative to this file.

Check these three anchors by contract, not by exact filenames or formatting:

- **Build setup:** a Vite + React + TypeScript app with a working `npm run build`.
- **Scene kit:** a typed step/scene contract, active-step stage with entity continuity, navigation/modes, chrome, and fit-scaled canvas.
- **Presentation index:** an explicit or equivalent registry routing each presentation independently.

If already inside a presentation app whose anchors are all present, use it. If all anchors exist, preserve them and proceed. If only some exist, add only the missing infrastructure; inspect dependencies and files first and preserve the working anchors and existing presentations. Do not replace a project merely because its structure differs from the template.

Choose the target before writing:

- Empty directory or standalone project: scaffold at its root.
- Monorepo (workspace declaration in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout): scaffold a self-contained app in `presentations/`.
- Existing app with anchors: work in that app.

When a non-empty project lacks any required anchors, state the exact target path and the files/infrastructure to be added, then get confirmation before writing. This confirmation is only for that scaffold target; continue autonomously after it is confirmed. Empty directories need no confirmation.

For a full scaffold, copy `templates/bootstrap/` to the resolved target. For partial scaffolding, copy only the missing pieces after adapting imports and configuration to the host. Install every runtime and development dependency listed in the bootstrap template's `package.json`; do not assume any are installed. Do not add Tailwind or another styling framework unless the host already uses it or the user asked for it.

## 3. Create or modify

For a new presentation, make a separate folder under `src/presentations/<slug>/` with presentation-owned entity IDs, step scene components, `Talk.tsx`, and any CSS needed for its look. Start from `templates/presentation/` for `Talk.tsx`, `entities.ts`, `steps.ts`, and `style.css`. Copy `templates/step/step.tsx` into the presentation's `steps/01-introduction.tsx`; `steps.ts` imports that path. Add later step files in the same folder and list them in order in `steps.ts`. Add one entry to the presentation registry. Never overwrite or restructure other registered presentations.

Model the content as a coherent progression: preserve stable entities across steps, then introduce, move, connect, emphasize, or remove them as the explanation develops. Give every step a stable id, era, title, caption, and scene payload. Use the typed `Step` and `SceneProps` contracts and generic kit primitives. Keep colors, fonts, spacing, borders, shadows, card/control treatments, and theme tokens in presentation-owned CSS (plain CSS by default), not in `src/presentation-kit/`.

For a modification, edit only the selected presentation and the registry or host files strictly needed for that request. Preserve the other presentations and their routes.

## 4. Verify and inspect

Do not report success until all applicable checks pass. From the app root:

1. Run `npm run build`; fix type or build failures.
2. Run `PRESENTATION_SLUG=<slug> npm run verify` when available, using the generated or modified presentation's slug; without the variable the verifier checks only its default route. Otherwise start a local Vite preview on `127.0.0.1`, open the generated route in a real browser, and confirm the first step renders without console/runtime errors and navigation works.
3. Capture settled browser views of the first, last, and dense/key steps. Check a narrow viewport too when the layout is responsive-sensitive. Prefer `npm run inspect -- <slug>` when the project's screenshot helper exists; otherwise place any temporary Playwright helper inside the project.
4. Review collisions, readability, active navigation and attribution. Fix accidental overlap, make current-step chrome distinct, and mark an overlap as intentional only when it is readable and genuinely part of the composition. Rerun affected checks after fixes.

A green build alone is not a render or visual check. If a check fails, repair the generated presentation and rerun it. Report the route, checks run, and any remaining advisory warnings accurately.

## Completion report

After verification, summarize the presentation and route, the files created or changed, and the build, render, and visual checks completed. State any unresolved advisory warnings or limitations; do not claim success when a required check failed.

Use this fixed report structure and give every required check a result:

```text
Presentation: <title>
Route: /<slug>
Files: <bulleted paths>
Checks: build — pass/fail; render — pass/fail; visual — pass/fail (viewport and steps checked)
Advisory warnings: <list or none>
Limitations: <list or none>
```

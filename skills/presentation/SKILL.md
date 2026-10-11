---
name: presentation
description: Creates and modifies evolving-scene browser presentations from a topic. Trigger for requests such as “make a presentation”, “create a browser talk”, “build slides”, or “modify this presentation”.
---

# Presentation

Create one browser presentation as a scene that evolves through named steps. Use the React scene kit when available; bootstrap it when needed.

## Procedure

1. **Discover.** Read the target app's package scripts, router, presentation registry, kit contract, and existing presentation examples. Match its conventions and identify any requested presentation to modify.
2. **Gather.** Ask one question at a time for missing information: topic, visual style, and then each step's content and visual description. Do not assume details the user can still provide. Accept an explicit choice to proceed with partial detail and iterate. If the prompt already supplies enough detail, proceed. For a key or complex step, optionally show one ASCII layout sketch for confirmation; do not sketch every step.
3. **Resolve the app and scaffold.** Check the three anchors at the contract level: a Vite/React/TypeScript build with a working `npm run build`; the scene kit's `Step`/`Scene` contract, stage, navigation, chrome and fit-scale canvas; and a registry mapping presentations to routes. Do not require byte-identical files. If all exist, skip scaffolding. If some are missing, add only missing anchors and dependencies without replacing existing ones. Never assume dependencies are installed; ensure React, React DOM, Motion, Lucide, Vite, React plugin, TypeScript and type packages, ESLint stack, and Playwright are installed.

   Resolve the target as follows: use the current app when already inside one; for a monorepo (package workspaces, `pnpm-workspace.yaml`, or `packages/`/`apps/` layout), create a self-contained app under `presentations/`; otherwise scaffold the standalone app at the project root. If none of the anchors exist, perform a full scaffold. In a non-empty project missing the kit or registry, state the exact target location and wait for confirmation before writing. Copy templates using paths relative to this `SKILL.md` file, never the caller's working directory. The bootstrap template is `templates/bootstrap/`; the presentation template is `templates/presentation/`.

   Keep scaffolding style-neutral: no required styling framework and no kit-owned colors, fonts, spacing theme, card, button, border, shadow, or theme-token defaults. Plain presentation-owned CSS is the default; use an existing host framework or one the user explicitly requests.
4. **Create or modify.** For a new presentation, create a self-contained folder with `entities.ts`, `steps/*.tsx`, `Talk.tsx`, and presentation-owned CSS based on `templates/presentation/`; add one explicit registry entry and preserve all existing routes. Give each step an id, era, title, caption, scene, and payload. Keep entity IDs stable across steps where the same entity persists. For a modification, if the target is missing or ambiguous, list registered presentations and ask which one; once identified, ask only about requested edits and change that presentation in scope without restarting the create interview.
5. **Verify and inspect.** Run `npm run build`, then render at least the first step and check for runtime or console errors. Install Playwright Chromium with `npx playwright install chromium` if it is unavailable. Inspect settled screenshots of the first, last, and dense or key steps using `npm run inspect -- <slug>`. Write any temporary Playwright helper under the project root. Check a narrow viewport when the layout is responsive-sensitive. Fix failures and accidental collisions, then re-run checks. Review inspection warnings; mark only intentional, readable overlaps with `data-presentation-allow-overlap`. Make active progress/ToC state visibly distinct and style attribution in presentation-owned or host CSS. Report any remaining advisory warnings accurately. Do not report success until checks pass.

## Output

Return the route, files created or changed, build/render/visual checks run, and any remaining advisory warnings. The presentation must build, render without errors, include a caption and working navigation for every step, fit its scene canvas, and keep scene content legible around chrome.

## Out of scope

This skill creates browser presentations. It does not export PowerPoint, Keynote, PDF, or image files, provide a visual editor, or publish/host presentations.

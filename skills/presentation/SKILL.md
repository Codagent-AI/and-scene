---
name: presentation
description: Creates and modifies evolving-scene browser presentations from a topic. Trigger for requests to make a presentation, build slides, create a browser talk, or modify the <name> presentation.
---

# Presentation

Create one browser presentation as a scene that evolves through named steps. Use the React scene kit when available; bootstrap it when needed.

## Procedure

1. **Discover.** Read the target app's package scripts, router, presentation registry, kit contract, and existing presentation examples. Match its conventions and identify any requested presentation to modify.
2. **Gather.** Ask one question at a time for missing information: topic, visual style, and then each step's content and visual description. Do not assume details the user can still provide. Accept an explicit choice to proceed with partial detail and iterate. If the prompt already supplies enough detail, proceed. For a key or complex step, optionally show one ASCII layout sketch for confirmation; do not sketch every step.
3. **Resolve the app and scaffold.**
   1. Check these three anchors at the contract level, not by byte comparison: (a) a Vite/React/TypeScript app whose `npm run build` works; (b) a scene kit with the `Step`/`Scene` contract, stage, navigation, chrome, and fit-scale canvas; (c) a registry mapping presentations to routes.
   2. Reuse the current app and skip scaffolding if all anchors exist. If only some exist, add only the missing anchors and their dependencies without replacing existing ones. If none exist, perform a full scaffold. Never assume dependencies are installed; ensure React, React DOM, Motion, Lucide, Vite, the React plugin, TypeScript and type packages, the ESLint stack, and Playwright are installed.
   3. Choose the target: use the current app when already inside one; in a monorepo (package workspaces, `pnpm-workspace.yaml`, or `packages/`/`apps/` layout), create a self-contained app under `presentations/`; otherwise scaffold at the standalone project root.
   4. Before writing into a non-empty project missing the kit or registry, state the exact target and wait for confirmation. Resolve `templates/bootstrap/` and `templates/presentation/` relative to this `SKILL.md`, never the caller's working directory.
   5. Keep the scaffold style-neutral: require no styling framework and add no kit-owned colors, fonts, spacing theme, card, button, border, shadow, or theme-token defaults. Default to plain presentation-owned CSS. Use the host's existing styling framework, or one the user names, only if the project already uses it or the user asks for it.
4. **Create or modify.** For a new presentation, create a self-contained folder with `entities.ts`, `steps/*.tsx`, `Talk.tsx`, and presentation-owned CSS based on `templates/presentation/`; add one explicit registry entry and preserve all existing routes. Give each step an id, era, title, caption, scene, and payload. Keep entity IDs stable across steps where the same entity persists, and wrap entities a grouped scene may drop in the kit's `Presence` with stable keys so they animate out. For a modification, if the target is missing or ambiguous, list registered presentations and ask which one; once identified, ask only about requested edits and change that presentation in scope without restarting the create interview.
5. **Verify and inspect.**
   1. Run `npm run build`. When the app provides it, run `npm run verify` to build and render the registered route while checking browser errors. Otherwise, start the dev server and use a project-local Playwright helper to open its URL, confirm the first step renders, and fail on `console.error` or uncaught page errors; write a temporary helper under the project root if needed. If Playwright Chromium is unavailable, install it with `npx playwright install chromium`.
   2. Capture settled screenshots of the first, last, and dense or key steps with `npm run inspect -- <slug>`. Keep any temporary Playwright helper under the project root. Also inspect a narrow viewport when the layout is responsive-sensitive.
   3. Review screenshots and warnings. Fix build or render failures, accidental collisions, indistinct active progress/ToC state, and unreadable attribution. Mark only intentional, readable overlap with `data-presentation-allow-overlap`.
   4. Repeat the build, render, and screenshot checks after fixes. Report remaining advisory warnings accurately; do not report success while a required check fails.

## Output

Report results in this format:

```text
Route: /<slug>
Files: <created or changed paths>
Checks: <build, render, and visual checks with pass/fail>
Advisories: <remaining warnings, or “none”>
```

Before reporting success, confirm that every step has a caption and working navigation, builds and renders without errors, fits the scene canvas, and remains legible around presentation chrome.

## Out of scope

This skill creates browser presentations. It does not export PowerPoint, Keynote, PDF, or image files; provide a visual editor; or publish/host presentations. If a request needs one of these, explain that it is outside this skill's scope and ask how the user wants to proceed with a separate workflow.

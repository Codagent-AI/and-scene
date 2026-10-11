---
name: presentation
description: Creates or modifies evolving browser presentations. Use for "make a presentation", "create a talk", "build slides about…", or "modify my presentation". Gathers the story and visual direction, scaffolds missing React infrastructure, and verifies behavior and visual composition.
---

# Presentation

Resolve every script, reference, and template below relative to the directory
containing this `SKILL.md`, never the caller's working directory. Keep generated
files and temporary browser helpers inside the selected project. Build one evolving
scene with stable entities; use `Talk.tsx` as the presentation entry component.

1. **Choose intent before gathering or writing.** For a new presentation, follow
   Create 1–3 then Verify 4. For a modification, follow M1–M3 then Verify 4;
   never run the create interview for a modification. Respect details and target
   authorization already supplied in the conversation. A complete prompt needs
   no further questions. If the user explicitly requests autonomous work, use
   supplied details and make scoped decisions without additional confirmation.

## Create

1. **Gather the story.** Ask one question at a time for missing topic, visual
   style, and each step's content and visual description. Do not invent details
   the user can still provide. Let the user choose to proceed with partial detail
   and iterate; do not impose a completeness gate. Optionally show an ASCII
   mockup for a key or complex layout, rather than for every step. Capture titles,
   captions, eras, scene intent, continuing entities, arrivals and departures.

2. **Resolve infrastructure before creating.** Inspect the build, scene kit, and
   routed registry contracts described in [references/scaffolding.md](references/scaffolding.md).
   Reuse an existing presentation app even if its formatting or file names differ.
   Otherwise use the standalone root; for `workspaces`, `pnpm-workspace.yaml`, or
   a `packages/` or `apps/` layout, use a self-contained `<repo>/presentations/` app
   and preserve the monorepo root. In any non-empty project, state the exact target
   and wait for user confirmation before writing unless the existing conversation
   already authorizes it. Run `node <skill-dir>/scripts/scaffold.mjs --target <repo-or-app>`.
   Read its resolved target and created/skipped anchors. Follow any exact printed
   entry-point wiring instruction before continuing; preserve the host at `/` and
   all previous host routes while adding `/<slug>`. Run `npm install` in the
   resolved app. If Chromium is missing, run `npx playwright install chromium`.

3. **Author and register.** Copy `templates/presentation/` into
   `src/presentations/<slug>/`, replacing template names, strings, entity namespace
   and root CSS class. Refuse a slug collision; do not overwrite another presentation.
   Follow [references/authoring.md](references/authoring.md) for grouped scenes,
   step files and chrome hooks. Write `entities.ts`, `steps/*`, `Talk.tsx`, and
   presentation-owned plain CSS; use a framework only if the host already uses
   it or the user requests it. Add one explicit literal-slug registry entry with
   `load: () => import('./<slug>/Talk')`. Preserve other presentations and the kit.

## Modify

1. **M1 — Identify before any write.** Read the registry. If the request does not
   clearly identify one presentation, list registered slugs/titles and ask which
   to modify. Do not scaffold or change any file until the target is identified.
   In autonomous work, use an unambiguous contextual target; report an unresolved
   ambiguity accurately instead of choosing and modifying an unrelated presentation.

2. **M2 — Gather only the requested change.** Ask one question at a time about
   the requested steps, entities, or style when needed. Do not re-ask topic, style,
   or per-step questions for unchanged parts. Reuse supplied answers and partial
   detail authorization.

3. **M3 — Ensure infrastructure, then edit.** Apply Create 2's target resolution,
   confirmation and missing-anchor procedure. Make scoped edits only in the
   selected presentation folder; adjust its registry line only if needed. Keep
   other presentations and kit files intact. Continue to Verify 4.

## Verify

4. **Self-verify before reporting success.** Run `npm run build`, then
   `npm run verify -- <slug>` and full `npm run verify` before completion.
   Run `npm run inspect -- <slug>` at desktop and, for responsive-sensitive work,
   `npm run inspect -- <slug> --viewport 390x844`. Review settled first, last,
   and dense/key step screenshots and every advisory `WARN`. Use the local helper;
   if absent, write a temporary Playwright helper under the project root. For
   interactive debugging use `chrome-devtools-axi` when available: open the
   `127.0.0.1` production preview, start with `snapshot`, then capture screenshots.
   Read [references/visual-check.md](references/visual-check.md). Fix functional
   failures, accidental collisions, indistinct active chrome and attribution in
   presentation-owned CSS; rerun affected checks until sound. Mark only intentional
   readable overlap with `data-presentation-allow-overlap`. Never report success
   while a check fails. Report the final build/render results and any remaining
   reviewed advisory warnings accurately. Stop preview processes after inspection.

---
name: presentation
description: Creates or modifies a browser presentation built as one evolving diagrammatic scene (stable entities that move, connect, and re-label across named steps). Use when asked to make a presentation about a topic, edit an existing one, or scaffold the presentation app. Self-bootstraps the Vite + React + TypeScript app, scene kit, and presentation index when they are missing.
---

# Presentation

A presentation is **one scene** that moves through ordered, named steps. Entities keep a stable
identity across steps, so they morph in place instead of being redrawn. "Talk" is only an informal
synonym; the per-presentation entry file is `Talk.tsx`.

Resolve every path below relative to **this file's directory** (`SKILL_DIR`), never the user's
current directory. Helper: `node SKILL_DIR/scripts/setup.mjs <detect|scaffold|create>`.
Templates live in `SKILL_DIR/templates/bootstrap/` (the app) and `SKILL_DIR/templates/presentation/`
(one presentation).

## 1. Gather (create) or identify (modify)

**Create.** Ask the user clarifying questions **one at a time**, in this order, skipping what the
prompt already answers: the topic, the visual style, then each step's content and visual
description. Never assume a detail the user can still give. The user decides how much to specify:
if they choose to build with partial detail, build from what you have without a completeness gate and
iterate afterwards. If the prompt already holds the topic, style, and every step, go straight to
building. For a key or complex step you may sketch an ASCII mockup to confirm the layout; do not do
this for every step.

**Modify.** If the target presentation is missing or ambiguous, list the registered presentations
(`src/presentations/index.ts`) and ask which one before changing anything. Then ask only about the
requested change (steps, entities, or style) and make scoped edits to that presentation. Do not
re-run the create interview.

## 2. Resolve the target and scaffold what is missing

Run `node SKILL_DIR/scripts/setup.mjs detect <project dir>`. It reports the three contract anchors
and where the app belongs:

1. **build** - Vite + React + TypeScript with a working `npm run build`
2. **kit** - `src/presentation-kit/` (step contract, stage, navigation, chrome, fit-scale canvas)
3. **index** - `src/presentations/index.ts`, the registry mapping each presentation to its own route

Detection is by contract, not byte equality: file naming, formatting, or extra dependencies never
trigger re-scaffolding.

- All three present: skip scaffolding.
- Empty directory or standalone project: scaffold at the root.
- Monorepo (`workspaces`, `pnpm-workspace.yaml`, or `packages/` / `apps/`): scaffold a self-contained
  app under `presentations/`; never change the monorepo root.
- Already inside a presentation app: use it and add only the missing anchors.

When `needsConfirmation` is true (a non-empty project missing the kit or index), **state the target
directory and wait for the user to confirm** before writing anything.

Then run `node SKILL_DIR/scripts/setup.mjs scaffold <target>`. It copies only the missing anchors,
never overwrites an existing file, merges missing dependencies and scripts into an existing
`package.json` (even when only the kit or index was missing), and runs `npm install` (do not assume
dependencies are installed). If the project already has an entry module, it is kept as `<entry>.host.*`
and a small router entry sends registered presentation routes to the kit and everything else to it. The runtime set is
`react`, `react-dom`, `motion`, `lucide-react`; the build set is `vite`, `@vitejs/plugin-react`,
`typescript`, the React/Node type packages, the ESLint stack, and `playwright`. The scaffold is
style-neutral: no Tailwind, theme, colors, fonts, or card/button styles. If Playwright's browser is
missing, run `npx playwright install chromium`.

## 3. Generate or modify

**Create:** `node SKILL_DIR/scripts/setup.mjs create <target> <slug> "<Title>"` writes
`src/presentations/<slug>/` (`entities.ts`, `steps/`, `Talk.tsx`, `talk.css`) and adds one line to
the registry; the presentation is then reachable at `/<slug>`. Existing presentations are left
untouched. The generated `talk.css` is comments only and the scaffold's `starter` has no stylesheet:
write the designed look yourself. Replace the placeholder content with the gathered steps:

- `entities.ts` is this presentation's `layoutId` namespace: one stable id per entity.
- Each step has `id`, `era` (section label), `title` (one line), `caption` (paragraph), and a
  `payload`. Steps that share a `groupKey` and `Scene` keep one scene instance, so continuing
  entities morph through `layoutId` and only newcomers use `appear`. Do not wrap continuing
  entities in fade-in behavior and do not rearrange them to suit the code; keep intentional overlaps.
- Compose the kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`,
  `SceneLayer`); for coordinate-heavy diagrams use their `className`/`style`/`at` props or raw
  `motion` elements with stable `layoutId`s. Icons are `lucide-react` components (`Icon={User}`).
- Step numbers come from position; never renumber by hand.

**Styling belongs to the presentation.** Put the look in `talk.css` (or host CSS) in plain CSS,
targeting the kit's `data-presentation-*` hooks. Use Tailwind or another framework only if the host
already does or the user asks. Never add colors, fonts, borders, shadows, or theme tokens to
`src/presentation-kit/`. Make the active step visible in the progress dots and table of contents
(`[data-presentation-active]`, `aria-current`) and make the bottom-right attribution
(`[data-presentation-attribution]`) legible. The kit adds no top-left brand; a host may pass `brand`.
Mark a deliberate, readable overlap with `data-presentation-allow-overlap` on that subtree only.

**Modify:** edit only the chosen presentation's files (plus registry/verification artifacts if
strictly needed).

## 4. Self-verify before reporting done

Do not report success until all of these pass; fix failures and re-run.

1. `npm run build` - no type errors.
2. Render check - at minimum the first step opens with no console or runtime errors; run the full
   `npm run verify` (build plus a real-browser pass over every step on `127.0.0.1`) for completion.
3. Visual composition - run the project-local helper `npm run inspect -- <slug>`; it writes settled
   per-step screenshots to `.presentation-inspect/<slug>/` and prints advisory warnings. Review the
   first step, the last step, and dense or key steps (and a narrow viewport, `--width 480`, when
   the presentation is responsive-sensitive). If the helper is unavailable, write any temporary
   Playwright script inside the project root so it resolves local dependencies. Confirm important
   content fits the fixed 880 x 380 canvas, intentional overlaps stay readable, and nothing collides
   with captions, progress, table of contents, or navigation.
4. Warnings: for each overlap, indistinct-active-chrome, or attribution warning, open the cited
   step, fix accidental collisions and chrome styling, and mark only genuinely intentional readable
   overlaps with `data-presentation-allow-overlap`. Re-run the helper and report any remaining
   advisory warnings honestly.

Quality bar: builds clean, renders the first step without errors, every step has a caption,
next/previous navigation works, the visual composition check passes, and the presentation follows
the evolving-scene model.

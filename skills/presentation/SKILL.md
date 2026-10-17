---
name: presentation
description: Creates or modifies a browser presentation (one evolving diagram scene moving through named steps) from a topic. Use when asked to make, build, extend or change a presentation, talk, or slide-style explainer in a web project. It interviews the user, scaffolds the scene kit when missing, generates the presentation, and verifies build, render and visual composition before reporting done.
---

# Presentation

A presentation is **one scene that evolves through named steps**, not a deck of slides. Entities
have stable identities; moving from step to step makes them move, resize, re-label, enter, or
leave in place. Presentations render with a vendored React scene kit (`src/presentation-kit/`).
The kit ships **no styling**: every presentation owns its colors, type, spacing and chrome look in
plain CSS (unless the host project already uses a styling framework or the user asks for one).

`SKILL_DIR` below is the directory containing this `SKILL.md`. Resolve every template and script
path from it (`$SKILL_DIR/templates/...`, `$SKILL_DIR/scripts/...`), never from the working
directory.

## 1. Decide what the user wants

- **Create** a presentation: go to step 2.
- **Modify** an existing one: go to "Modify an existing presentation" below.

## 2. Gather the requirements, one question at a time

Ask only for what is missing from the user's prompt, **one question per message**, in this order:

1. The **topic** (and audience, if it changes the story).
2. The **visual style** (mood, palette, typography, density).
3. For each **step**: its title (one line), its caption (a paragraph for browse mode), and a
   description of what the diagram shows, what morphs from the previous step, and what enters or
   leaves.

Rules:

- Do not assume details the user can still provide. Do not invent a style or step content you
  could have asked about.
- The user controls the depth. If they choose to build with partial detail ("just build it"), do
  so from what was captured; there is no completeness gate. They can iterate afterwards.
- If the prompt already contains the topic, style and every step, go straight to building.
- For a key or visually complex step you may draw an ASCII mockup and ask the user to confirm the
  layout. Do not do this for every step.

## 3. Resolve the target and scaffold what is missing

Run, from the user's project directory:

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" detect
```

It reports the resolved `appDir`, why, which of the three contract anchors exist, and which are
`missing`:

1. **build** — Vite + React + TypeScript app with a working `npm run build`.
2. **kit** — `src/presentation-kit/` (the `Step`/`Scene` contract, stage, navigation, chrome).
3. **index** — `src/presentations/index.ts`, the registry mapping each presentation to its route.

Detection is by anchor, so cosmetic differences (file names, formatting, extra dependencies) do
not trigger re-scaffolding. Target resolution:

- Empty directory or standalone project → the repository root.
- Monorepo (`workspaces`, `pnpm-workspace.yaml`, `lerna.json`, `turbo.json`, or a top-level
  `packages/` or `apps/`) → a self-contained app in `presentations/`; never edit the monorepo root.
- Already inside (or next to, in `presentations/`) a presentation app → use it.

Then:

- All anchors present → skip scaffolding.
- Some missing → scaffold **only** the missing anchors; never disturb what exists.
- If `needsConfirmation` is true (the project is not empty and something must be written), **state
  the target directory and what will be written, and wait for the user to confirm** before running
  `apply`. An empty directory needs no confirmation.

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" apply            # add --target <dir> to follow a corrected target
```

`apply` copies the missing parts from `$SKILL_DIR/templates/bootstrap/`, never overwrites existing
files, merges `package.json` instead of replacing it, and runs `npm install` so the full
dependency set is present (React, Vite, TypeScript and its types, Motion, Lucide, ESLint,
Playwright). Do not assume any dependency is already installed. Playwright also needs a Chromium
(`npx playwright install chromium` if none is available). The scaffold requires no Tailwind or other
styling framework and defines no colors, fonts or component looks.

## 4. Create the presentation

Pick a lowercase hyphenated slug from the topic, then:

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" create <slug> "<Title>" --app <appDir>
```

This copies `$SKILL_DIR/templates/presentation/` to `src/presentations/<slug>/` and adds the
registry line to `src/presentations/index.ts`. Existing presentations are untouched. Then replace
the template's content with the user's story. Read `references/authoring.md` for the kit API and
the conventions below:

- `entities.ts` — the presentation's `layoutId` namespace (stable ids).
- `steps.ts` — one `Step` per beat: `id`, `era`, `title` (one line), `caption` (paragraph), `Scene`,
  and a typed `payload`. Give consecutive steps of one diagram the same `groupKey` and `Scene` so
  the scene persists and entities morph in place instead of remounting.
- `Scene.tsx` — composes kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
  `SymbolChip`, `Appear`, `SceneLayer`) on the fixed 880 × 380 canvas. Entities that persist keep
  their id and change position, size, label or emphasis; wrap newcomers in `Appear` so they enter
  after the others settle; wrap leavers' presence in `Appear when={…}` so they animate out.
- `talk.css` — **all** styling, in this presentation's own plain CSS, targeting the kit's
  `data-presentation-*` hooks. Style the active progress item and active table-of-contents entry
  (`[data-presentation-active]`) so the current step is clearly distinct, and style
  `[data-presentation-attribution]` so the "made by and-scene" link is legible. Never add styles,
  colors or fonts to `src/presentation-kit/`.

## 5. Verify before reporting done

All of these must pass. If any fails, fix the cause and re-run; never report success on a failure.

1. `npm run lint` and `npm run build` — no type errors.
2. `npm run verify` — builds the app and renders every step of every registered presentation in
   Chromium on `127.0.0.1`, failing on any console or page error.
3. Visual composition — run the project-local screenshot helper (prefer it over ad hoc scripts;
   if it is missing, write any temporary Playwright script under the project root so it resolves
   local dependencies):

   ```bash
   npm run inspect -- <slug>            # desktop 1440 × 900 → inspection-output/<slug>/step-NN.png
   npm run inspect -- <slug> --narrow   # 390 × 844 → inspection-output/<slug>-narrow/
   ```

   The helper waits for animations to settle before each capture. Open the screenshots (or inspect
   the page with `chrome-devtools-axi`: `snapshot`, then `screenshot`) for the **first step, the last
   step, and every dense or key step**; also check a narrow viewport when the presentation is
   responsive-sensitive. Confirm important content fits the canvas, intentional overlaps stay
   readable, and nothing collides with the caption, progress dots, table of contents, controls or
   attribution.
4. Review every `WARN step N …` line the helper prints. They are advisory, but each must be
   resolved: fix accidental collisions; make active chrome visibly distinct; style the
   attribution through its hook. Only mark a subtree with `data-presentation-allow-overlap` when
   the overlap is intentional and readable, and mark just that subtree. Re-run the helper after
   fixing, and report any warnings that remain, accurately.

The screenshot directory `inspection-output/` is gitignored; do not commit screenshots or `dist/`.

## Modify an existing presentation

1. Identify the target. If the user did not name one, or the name is ambiguous, list the
   presentations from `src/presentations/index.ts` (slug and title) and ask which one **before
   changing anything**.
2. Ask only about the requested changes (steps, entities or style). Do not re-run the create
   interview.
3. Edit only that presentation's folder (and the registry only if its title or slug must change).
   Keep entity ids stable so existing morphs still work.
4. Run the same verification as step 5.

## Quality bar

A generated presentation builds with no type errors, renders its first step with no runtime or
console errors, shows a caption per step, supports next/previous navigation, passes the visual
composition check, and follows the evolving-scene model: one scene, stable entity identities,
numbered by position, with a present mode (title only) and a browse mode (caption, table of
contents, controls, progress).

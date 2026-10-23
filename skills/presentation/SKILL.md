---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagrammatic scene (stable entities that appear, move, connect and re-label across named steps). Use when asked to make, build, add or change a presentation, talk, deck or animated explainer from a topic. Self-bootstraps the Vite + React + TypeScript scaffold and scene kit when missing, and verifies build, render and visual composition before reporting done.
---

# Presentation

A presentation is **one scene** moving through ordered, named steps. Entities
keep a stable `layoutId`, so they morph in place from step to step; newcomers
fade in after the persisting entities settle and departing ones fade out. It is
not a deck of unrelated slides.

All paths below are relative to the directory that contains **this** `SKILL.md`
(call it `$SKILL`). Never resolve templates or helpers against the user's
current directory: `$SKILL/templates/bootstrap/`, `$SKILL/templates/presentation/`
and `$SKILL/scripts/scaffold.mjs` are always found next to this file.

## Procedure

1. **Gather** the details (below).
2. **Resolve the target and scaffold** what is missing (below).
3. **Generate or modify** the presentation.
4. **Self-verify**, fix, and only then report.

## 1. Gather

Ask the user clarifying questions **one question at a time**, waiting for each
answer before asking the next. Cover, in this order, whatever is still unknown:

1. the **topic** (and audience, if it changes the depth);
2. the **visual style** (mood, palette, typography, density);
3. for **each step**: its content (title, one-paragraph caption, section/era) and
   a description of the **visual** (what appears, moves, connects or changes).

Rules:

- Do **not** invent a topic, style or step the user can still tell you. Ask.
- The user controls the depth. If they say to build with what they have given
  you ("just build it", "sketch a few steps"), proceed with the partial detail
  you captured and iterate afterwards. There is no completeness gate; fill gaps
  only with clearly labeled placeholders and say so.
- If the prompt already contains the topic, the style and every step, skip the
  interview and build; do not ask redundant questions.
- For a step whose layout is key or complex, you **may** draw an ASCII mockup
  and ask the user to confirm it before building. Do not mock up every step.

## 2. Resolve the target and scaffold

A presentation app needs three **contract anchors**. Detect them by contract,
not by byte-identical files, so renamed files, formatting or extra dependencies
never trigger re-scaffolding:

| Anchor | Contract |
| --- | --- |
| Build setup | A Vite + React + TypeScript app: `package.json` with a working `npm run build`, a Vite config and a `tsconfig.json`. |
| Scene kit | The presentation-agnostic engine: the `Step`/`Scene` step contract, the stage that mounts the active step and runs entity morphs, present/browse navigation, the chrome (captions, table of contents) and the fit-scale canvas. |
| Presentation index | The registry that maps each presentation's slug to a loader and a route, so several presentations coexist. |

Run the helper to see what is missing and where it belongs:

```bash
node "$SKILL/scripts/scaffold.mjs" plan <project-dir>
```

It prints the resolved target, the anchors present, the files it would create
and the dependencies it would add. Its target rules:

- **Already inside a presentation app** (kit or index present): use it, even in
  a monorepo; scaffold only missing anchors.
- **Monorepo** (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a
  `packages/` or `apps/` directory): scaffold a self-contained app into
  `presentations/`. Never mutate the monorepo root's build setup or its
  unrelated files.
- **Empty or standalone project**: scaffold at the project root.

Then:

- **All three anchors present**: skip scaffolding and go to step 3.
- **None present** (empty directory or unscaffolded project): full scaffold,
  then install dependencies, **before** creating the presentation.
- **Some present**: scaffold only the missing anchors and their dependencies;
  leave the present ones untouched (the helper never overwrites a file; if a
  needed file such as `src/main.tsx` already exists, wire it by hand).
- **Non-empty project that lacks the scene kit or the index**: first **state
  the resolved target location** (e.g. "I will scaffold a self-contained app in
  `presentations/`") and **proceed only after the user confirms**. Write nothing
  before the confirmation. An empty directory needs no confirmation.

Apply with `node "$SKILL/scripts/scaffold.mjs" apply <project-dir> --install`.
Never assume dependencies are installed. The scaffold ensures the full set:
`react`, `react-dom`, `motion`, `lucide-react`, `vite`, `@vitejs/plugin-react`,
`typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack
and `playwright` (install Chromium with `npx playwright install chromium` if the
browser is missing).

The scaffold is **styling-framework neutral** and ships **no presentation
styling**: no Tailwind, theme, colors, fonts, card or button styles. A
two-step, unstyled `starter` presentation is registered so the app renders out
of the box. Add Tailwind or another framework only when the host already uses
it or the user explicitly asks.

## 3. Generate or modify

### Create

```bash
node "$SKILL/scripts/scaffold.mjs" create <slug> "<Title>" <app-dir>
```

This copies `$SKILL/templates/presentation/` into
`src/presentations/<slug>/` and appends one entry to
`src/presentations/index.ts` (existing entries are never touched). Each
presentation is its own self-contained folder reachable at its own route
`/<slug>`:

- `outline.ts`: titles, eras and captions (one entry per step);
- `entities.ts`: this presentation's `layoutId` namespace and the entity data
  (design coordinates inside the **880 × 380** canvas);
- `steps/*`: the scene composing the kit primitives (`Box`, `Label`, `Arrow`,
  `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`);
- `Talk.tsx`: `<Presentation steps=… title=… initialMode=… />`;
- `talk.css`: the presentation's own look (the template holds only guidance
  comments; write the CSS yourself).

Guidelines:

- Entities accumulate and keep their identity. Move or re-label them rather
  than redrawing; give each entity one stable `layoutId`. Steps that share a
  `groupKey` and `Scene` update one mounted scene in place.
- **Styling belongs to the presentation or host**: plain CSS in
  `talk.css` (or the host's CSS) targeting the kit's stable
  `data-presentation-*` hooks. Never add colors, fonts, borders or buttons to
  `src/presentation-kit/`. Use plain CSS unless the host already uses a styling
  framework or the user explicitly requests one.
- In that CSS, make the **active** progress dot and table-of-contents entry
  visibly different (`[data-presentation-active='true']`) and make the
  attribution link (`[data-presentation-attribution]`) legible: at least 11px,
  not the browser-default blue underline. The template's `talk.css` shows both.
- **Preserve existing presentations**: never edit another presentation's folder
  or registry entry when adding one; all existing routes must still work.
- A deliberate overlap or stacking (a socket docked on a tray, a badge on a
  card) is kept as designed: do not spread entities apart just to satisfy a
  pattern. Mark only that subtree with `data-presentation-allow-overlap` and a
  comment saying why.

### Modify

1. If the user did not name the target presentation clearly (or named one that
   does not exist), **list the registered presentations** (slug and title) and
   ask which to modify. Change nothing before they answer.
2. Once the target is identified, ask **only** about the requested changes
   (steps, entities or style). Do not re-walk the create interview.
3. Edit that presentation in place. Touch another presentation, the registry or
   the shared kit only when the change strictly requires it.

## 4. Self-verify before reporting completion

Never report success until all of these pass, fixing failures yourself:

1. **Build**: `npm run build` has no type or build errors.
2. **Render**: at minimum the new or modified presentation renders its first
   step without runtime or console errors: `npm run verify -- <slug>` (builds the
   whole app, then renders that presentation in Chromium on `127.0.0.1`). Before
   finishing, run plain `npm run verify`, which renders every registered
   presentation (the reference sample through every step).
3. **Visual composition**: inspect browser views of the **first step, the last
   step, and any dense or key steps**, and a **narrow viewport** when the
   presentation is responsive-sensitive. Prefer the project-local helper, which
   resolves browser tooling from the project's own dependencies and waits for
   animations to settle before each capture:

   ```bash
   npm run inspect -- <slug>            # desktop, writes inspection/<slug>/step-NN.png
   npm run inspect -- <slug> --narrow   # 390 x 844
   ```

   If the helper is not present, write any temporary Playwright script **under
   the project root** (never in `/tmp` or the user's home), so Playwright resolves
   from the project. When an agent browser CLI such as `chrome-devtools-axi` is
   available, take a `snapshot` first and then a `screenshot`.
   Confirm that important scene content fits the fixed canvas, that intentional
   overlaps stay readable, that nothing collides with the captions, progress
   dots, table of contents or navigation controls, that the active step is
   visibly distinct and that the attribution is legible.
4. **Review every warning** the helper prints (`WARN step NN overlap | active-chrome
   | attribution`). Open the cited step and decide:
   - an accidental collision: fix the layout;
   - indistinct active chrome or unpolished attribution: fix the presentation CSS
     at the hook the warning names;
   - a genuinely intentional, readable overlap: add
     `data-presentation-allow-overlap` to **that one subtree only**, with a comment
     giving the reason. Never suppress warnings broadly.
   Then re-run the helper and re-inspect.

If the build, render or a visual check fails, **fix the cause and re-run the
checks**. Do not report success while any check fails. When you report, state
which checks ran and their results, including any remaining advisory warnings.
Screenshots and warnings are advisory inspection artifacts: a quiet helper does
not by itself prove the composition is good, so still look at the views.

Keep `inspection/`, `dist/` and `node_modules/` out of version control.

## Reference

- The kit's contract (hooks, modes, navigation keys: `→`/`Space`/`PageDown` next,
  `←`/`PageUp` back, `P` toggles present/browse; swipe left/right) is documented in
  the kit source under `src/presentation-kit/`.
- `src/presentations/how-to-make-a-presentation/` is a complete worked example,
  itself produced the way this skill describes.

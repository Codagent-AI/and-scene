---
description: >-
  Creates and modifies browser-based presentations, decks, talks, and
  walkthroughs. Use when the user asks to create a presentation, deck, talk,
  or walkthrough as a web app, to modify an existing one, to add or change
  steps, or to resync a project's vendored scene kit. Models the result as one
  evolving diagrammatic scene (stable entities moving through named steps)
  rather than independent slides. Self-bootstraps the build setup, scene kit,
  and presentation registry when they are missing, then generates or edits the
  presentation and verifies it builds, renders, and looks right before
  reporting done.
---

Create or modify a presentation by gathering requirements one question at a
time, ensuring the project provides the infrastructure a presentation depends
on, generating or editing the presentation, and self-verifying build, render,
and visual composition before reporting success.

Every path referenced below (`templates/bootstrap/`, `templates/presentation/`)
is relative to this file's own directory (`skills/presentation/`), **not** the
caller's current working directory. Resolve them from `import.meta.url` /
`__dirname` equivalents or from the absolute path of this `SKILL.md`, so the
skill behaves the same regardless of where it is invoked from.

## Step 1 — Gather requirements

Ask one question at a time. Do not assume an answer the user could still
provide themselves, but let them stop early and build from partial detail —
this is not a hard completeness gate.

Ask, in roughly this order, stopping as soon as the user chooses to proceed:

1. **Topic** — what is this presentation about?
2. **Visual style** — any look, tone, or reference the presentation should
   have? (If the user has no preference, note that and choose something
   reasonable yourself during generation — do not keep asking.)
3. **Steps** — for each step (or "however many steps make sense" if the user
   wants you to propose an outline): its content and its visual/diagrammatic
   intent — what's on screen, what's new, what persists from the step before.

Sketch a small ASCII mockup and confirm it with the user before building only
when a step's layout is genuinely key or complex — not for every step, only
where it earns its keep.

If the prompt that invoked this skill already contains the topic, style, and
every step's content, you may skip straight to Step 2 without asking anything.

If modifying an existing presentation (see Step 5), do not re-ask the full
create flow — identify the target first, then ask only about the requested
change.

## Step 2 — Detect anchors and resolve a target

The project's presentation infrastructure is three **contract anchors**,
detected by presence/shape, not by byte-identical files:

1. **Build setup** — a Vite + React + TypeScript app with a working
   `npm run build` (a `package.json` with `vite`/`react`/`typescript` deps and
   a `vite.config.ts`).
2. **Scene kit** — a module exposing the `Step`/`Scene` contract, a stage/host
   that mounts the active step and runs entity morphs, present/browse
   navigation, and chrome (captions, table of contents) with fit-scale canvas
   (look for `presentation-kit/` exporting `Presentation`, `Step`, `Stage`).
3. **Presentation index** — a registry mapping presentation slugs to routes
   (look for a `presentations/index.ts`-shaped array of
   `{ slug, title, load }`).

Cosmetic differences (file naming, formatting, extra dependencies already in
the project) do not mean an anchor is missing — check for the contract, not an
exact file layout.

**Resolve the target directory:**

- Empty directory, or a standalone (non-monorepo) project → the repository
  root.
- Monorepo signals present (`workspaces` in the root `package.json`,
  `pnpm-workspace.yaml`, or a `packages/`/`apps/` layout) → a self-contained
  app under `presentations/`, not the monorepo root.
- Anchors already present → use that project as-is; do not move it.

**If the project is non-empty but missing one or more anchors**, state the
target location you are about to scaffold into and wait for the user to
confirm before writing anything.

## Step 3 — Scaffold whatever is missing

Scaffold only the anchors that are actually missing; leave existing anchors
untouched. Never assume required dependencies are already installed — check
`package.json` and install what's missing.

Copy from `templates/bootstrap/` (resolved relative to this skill's own
directory, per the note above), adapting paths to the resolved target:

- `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`,
  `index.html` → build setup, if missing.
- `src/presentation-kit/**` → scene kit, if missing. If a scene kit already
  exists, do not overwrite it even if this template's copy has since drifted —
  the existing one is the contract, not this snapshot.
- `src/presentations/index.ts` (starts empty), `src/main.tsx`, `src/router.ts`,
  `src/Landing.tsx`, `src/index.css` → presentation index and app shell, if
  missing.
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` → the project-local
  build/render verifier and screenshot helper, if missing.

Install the full required dependency set the copied files need (merge into an
existing `package.json` rather than clobbering it):

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Dev/build: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`, the ESLint stack
  (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `globals`), and `playwright` (for the render
  check — after installing, run `npx playwright install chromium` if Chromium
  isn't already available).

Do **not** add Tailwind, a Tailwind Vite plugin, a default CSS theme, or any
other styling framework unless the host project already uses one or the user
explicitly asks for it. The scaffold and scene kit must build and run with
zero palette, typography, spacing, border, shadow, card, button, or theme
defaults — all of that is presentation-owned.

If all three anchors are already present, skip this step entirely and go
straight to Step 4.

## Step 4 — Generate a new presentation

Each presentation is a self-contained folder registered at its own route,
using `templates/presentation/` as a starting skeleton (again resolved
relative to this skill's directory):

1. Pick a `kebab-case` slug from the topic (e.g. `how-we-ship-releases`).
2. Create `src/presentations/<slug>/` (or the equivalent path in the resolved
   target) containing:
   - `entities.ts` — copy `templates/presentation/entities.ts`; define this
     presentation's own `layoutId` namespace for every entity that should
     morph across steps.
   - `steps/*.tsx` — one file per step or per group of steps that share a
     `Scene` (steps sharing a `groupKey` must share the same `Scene`
     component so the instance persists and only `payload` changes). Start
     from `templates/presentation/steps/Step.template.tsx`, composing the
     kit's generic primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
     `SymbolChip`, `Appear`, `SceneLayer`) — never edit the kit itself to add
     a talk-specific node.
   - `Talk.tsx` — copy `templates/presentation/Talk.template.tsx`; import the
     steps in order and render `<Presentation steps={...} title={...} />`.
   - `presentation.css` (or the host's existing styling approach) — copy
     `templates/presentation/presentation.template.css`; this is where the
     designed visual style (palette, typography, spacing, borders, shadows,
     card/button treatment, and a visibly distinct active state for progress
     dots / table-of-contents entries) actually lives. Plain CSS is the
     default unless the host already uses a styling framework or the user
     asked for one.
3. Register the presentation by adding one entry to
   `src/presentations/index.ts`:

   ```ts
   { slug: '<slug>', title: '<Title>', load: () => import('./<slug>/Talk') }
   ```

   Add the entry without touching any other existing entry — other
   presentations must remain intact and reachable.

Keep the reusable scene kit itself untouched by this step. If something the
presentation needs feels like it belongs in the kit (a new generic primitive,
a chrome affordance), that is a kit change, not a presentation change — make
it deliberately in `presentation-kit/`, keep it style-neutral, and expose a
stable `data-scene-kit` hook, rather than smuggling one-off styling into a
"generic" node.

## Step 5 — Modify an existing presentation

If asked to modify a presentation without a clear, unambiguous target, list
the presentations currently in the registry and ask which one before changing
anything.

Once the target is identified, ask only about the requested change (steps to
add/remove/edit, entities to introduce, or style adjustments) — do not re-walk
the full Step 1 gathering flow. Scope all edits to that presentation's own
folder; do not touch other presentations or the scene kit unless the requested
change is explicitly a kit change.

## Step 6 — Self-verify before reporting done

Never report success without running these checks and fixing any failure
first:

1. **Build** — `npm run build` (or the project's equivalent) with zero type
   errors.
2. **Render check** — at minimum, the new/modified presentation's first step
   renders with no runtime or console errors. Prefer the project-local
   `npm run verify` (from the scaffolded `scripts/verify.mjs`) over an ad hoc
   script, since it resolves browser tooling from the project's own
   dependencies. If a fuller multi-step render check is available (see the
   `presentation-verification` capability for the canonical sample), use it.
3. **Visual composition check** — inspect the first step, the last step, and
   any dense/key steps in a real browser. If the presentation is
   responsive-sensitive, also check a narrow viewport. Prefer the
   project-local screenshot helper (`npm run inspect -- <slug>`) so
   screenshots are captured after `motion` animations settle and advisory
   warnings are available; only fall back to an ad hoc Playwright script
   written under the project root if no local helper exists.
4. **Review the advisory warnings.** For every overlap, indistinct
   active-state, or attribution warning the helper reports: fix genuine
   collisions and indistinct styling, and mark only deliberate, readable
   overlaps as allowed (e.g. `data-allow-overlap="true"` on the overlapping
   element) rather than silencing the warning by ignoring it.

If the build, render check, or visual check fails, fix the underlying issue
and re-run the checks — do not report the presentation as done on a failing or
unreviewed state.

### Completion report

Report completion in exactly this shape, so nothing material is left implicit:

```
Presentation: <title> (<slug>) at <route> — created | modified
Files: <paths added or changed>
Build: pass | fail (<command run>)
Render: pass | fail (<command run>, <n> steps rendered)
Inspected: <steps and viewports actually viewed, e.g. steps 1, 5, 9 at 1280x800 + 420x760>
Advisory warnings: none | <each warning and whether it was fixed or deliberately allowed, with why>
Follow-ups: none | <anything left undone, unverified, or needing the user's decision>
```

Every field is required. Write `none` rather than dropping a line, and never
report a check as `pass` without having run it in this session.

## Quality bar for every generated or modified presentation

- Builds with zero type errors.
- Renders its first step with no runtime or console errors.
- Every step shows a caption; next/previous navigation works.
- Key screenshots show scene content fitting the fixed canvas, with no
  accidental collisions between diagram content and chrome (captions,
  progress dots, table of contents, prev/next).
- Table-of-contents, progress, navigation, and attribution chrome all read as
  visually distinct/legible via presentation- or host-owned CSS — the scene
  kit itself stays free of default colors, fonts, borders, buttons, and theme
  tokens.

## Out of scope

This skill builds browser-based, step-based presentations in the target
project. It does not cover:

- **Non-browser formats** — PowerPoint, Keynote, Google Slides, PDF decks, or
  exporting to them. Say so and offer the browser presentation instead.
- **Static image or video output** — recording, narrating, or rendering the
  presentation to a movie. Screenshots exist for verification only.
- **Redesigning the host application** — routing, layout, or styling outside
  the presentation's own folder and its registry entry.
- **Editing other presentations** — scope every change to the selected target;
  touching a sibling presentation needs the user to ask for it.
- **Replacing or restyling the shared scene kit** — treat the kit as
  style-neutral infrastructure. Change it only when the user explicitly asks
  for a kit change, and never to fix one presentation's styling.
- **Content research** — the user supplies the substance; do not invent facts,
  data, or quotes to fill steps.

When a request falls outside this list, say which part is out of scope, do the
part that is in scope, and leave the rest to the user.

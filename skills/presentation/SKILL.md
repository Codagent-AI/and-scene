---
name: presentation
description: Creates or modifies a browser-based "evolving scene" presentation — one continuous diagram whose entities morph across named steps, not a slide deck. Gathers topic, visual style, and per-step content one question at a time; self-bootstraps the Vite+React scene kit when missing; scaffolds a new presentation or edits an existing one; then builds, renders, and visually inspects it before reporting done. Trigger on "make a presentation", "create a talk/deck", "add a step to my presentation", "modify the <name> presentation", or any request to build/edit an and-scene-style evolving-scene deck.
---

# Presentation skill

Builds presentations as one evolving diagram: stable entities (`layoutId`)
morph in place across steps instead of slides being swapped out. Read
`src/presentation-kit/types.ts` (or the copy under `templates/bootstrap/`) if
the step/Scene contract is unfamiliar before writing any step code.

## Out of scope

This skill does NOT:
- Export to PPT/Keynote/PDF/images, or provide a visual editor.
- Add Tailwind or any styling framework — presentation CSS is plain CSS unless
  the host project already uses a framework or the user explicitly asks for one.
- Rewrite or restyle the reusable scene kit to fit one presentation's look.
- Touch presentations other than the one being created or modified.

## Procedure

### 1. Gather requirements (one question at a time)

Ask for, in order, only what the prompt doesn't already give:
1. Topic (what the presentation is about).
2. Visual style / look and feel.
3. Each step's content and visual intent (what changes, what stays).

Do not assume an unstated detail — ask for it. The user controls depth: if
they choose to proceed with partial detail, build from what's captured
instead of blocking on completeness. If the prompt already has topic, style,
and every step, skip straight to building.

For a step whose layout is key or complex, you may sketch an ASCII mockup to
confirm it before building — don't do this for every step, just the ones
where it earns its keep.

### 2. Identify create vs. modify

- **No target named / ambiguous "modify" request** — list existing
  presentations (`src/presentations/index.ts` or the host's equivalent) and
  ask which one, before changing anything.
- **Modify, target identified** — ask only about the requested change (steps,
  entities, or style). Do not re-run the full gathering flow.
- **Create** — continue to scaffolding.

### 3. Resolve target and scaffold what's missing

Detect three contract anchors at the *contract* level (their presence, not a
byte-identical match):
1. **Build setup** — a Vite + React + TypeScript app with `npm run build`.
2. **Scene kit** — `src/presentation-kit/` exposing the `Step`/`Scene`
   contract, `Presentation`/`Stage`, nav, and chrome.
3. **Presentation index** — `src/presentations/index.ts` registry.

Resolve where to scaffold:
- Empty directory or standalone (non-monorepo) project → repo root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a
  `packages/`/`apps/` layout) → a self-contained app under `presentations/`.
- Anchors already present → use that project; do not rescaffold it.

If the project is non-empty and missing anchors, state the resolved target
location and get explicit confirmation before writing anything. Then scaffold
only the missing anchors from `templates/bootstrap/` (see
[references/scaffolding.md](references/scaffolding.md) for the full anchor
checklist, dependency set, and monorepo-detection detail) — resolve every
template path relative to this file's directory, never the caller's cwd.
Leave present anchors and unrelated project content untouched.

### 4. Generate or modify

**Create:** copy `templates/presentation/` into a new folder named after the
presentation's slug, replacing `__SLUG__`, `__TITLE__`, `__ERA__`,
`__STEP_TITLE__`, `__STEP_CAPTION__`, `__STEP_VISUAL__` placeholders; add one
step file per gathered step (copy `templates/step/step.tsx` for steps beyond
the first, replacing `__STEP_ID__`, `__GROUP_KEY__` too); give a shared
`groupKey` to adjacent steps that should keep one Scene mounted (e.g. an
accumulating tray) instead of remounting. Rename the presentation's `.css`
file to match its slug and write the designed look there — plain CSS by
default. Add one line to `src/presentations/index.ts`:
`{ slug, title, load: () => import('./<dir>/Talk') }`. Do not touch any other
registry entry or presentation folder.

**Modify:** edit only the identified presentation's files, scoped to the
requested change. Keep every other presentation and the registry order
otherwise untouched.

### 5. Self-verify before reporting done

Run, in order, fixing failures and re-running rather than reporting success
with a failing check:
1. `npm run build` — no type or build errors.
2. A render check of at least the new/changed presentation's first step
   (`npm run verify` covers the full app; prefer it, but a single-route
   render check is the minimum before reporting done).
3. Visual composition check: screenshot or view the first step, the last
   step, and any dense/key step; also check a narrow viewport if the
   presentation is responsive-sensitive. Prefer the project-local
   `npm run inspect -- <slug>` helper over an ad hoc script outside the
   project tree.
4. Review any overlap/active-state/attribution warnings the inspector
   reports: fix accidental collisions and indistinct active chrome; mark only
   genuinely intentional, readable overlaps with `data-presentation-allow-overlap`
   on the containing element — do not blanket-suppress warnings.

See [references/verification.md](references/verification.md) for what each
check asserts and how to read its output.

## Output format for the completion report

End with a short report:
- **Target:** path scaffolded/edited into, and whether it was root or
  `presentations/`.
- **Presentation:** slug, route, and create vs. modify.
- **Checks:** build / render / visual — pass, with any warnings reviewed and
  their resolution (fixed vs. marked intentional).
- **Preserved:** confirmation that other presentations/registry entries are
  untouched (modify) or that the scaffold only added missing anchors (create
  in a non-empty project).

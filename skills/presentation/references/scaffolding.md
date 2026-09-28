# Scaffolding reference

## Anchor checklist

Check for each anchor independently; scaffold only the ones missing.

**Before writing any scaffold file, check whether that exact destination path
already exists — an anchor can be missing while some of its files are
already present for an unrelated reason (an existing `package.json`, a
`vite.config.ts` from a different setup, etc.).** If the destination file
doesn't exist, copy the template file verbatim. If it does exist, read it
first and merge in only what's missing instead of overwriting it:
- `package.json` — add missing `dependencies`/`devDependencies` entries and
  add the missing npm scripts (`build`, `verify`, `inspect`, …); keep every
  existing field, script, and dependency version the project already has.
- `vite.config.ts`/`tsconfig*.json`/`eslint.config.js` — add only the
  missing plugin/compiler-option/config entries the anchor needs (e.g. the
  React plugin, the `jsx`/`moduleResolution` options); don't replace the
  file wholesale.
- `index.html`, `public/` assets — leave alone if present; only add what's
  absent.

1. **Build setup** — `package.json` with a `build` script that runs
   `tsc -b && vite build` (or equivalent), plus `vite.config.ts` and
   `tsconfig*.json`. Missing → apply `templates/bootstrap/{package.json,
   vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json,
   eslint.config.js, index.html, public/}` using the merge rule above.
2. **Scene kit** — `src/presentation-kit/types.ts` exporting `Step`/`Scene`,
   and `src/presentation-kit/Presentation.tsx`. Missing → copy
   `templates/bootstrap/src/presentation-kit/` verbatim (it is a snapshot of
   the canonical kit; don't hand-edit it into a different shape). If the
   directory already exists but is incomplete, add only the missing files —
   never overwrite a kit file that's already there.
3. **Presentation index** — `src/presentations/index.ts` exporting a
   `presentations` array of `{ slug, title, load }`. Missing → apply
   `templates/bootstrap/src/presentations/index.ts`,
   `templates/bootstrap/src/{main.tsx,App.tsx,router.ts,Landing.tsx,
   Landing.css,presentationLoader.ts,index.css}`, and
   `templates/bootstrap/scripts/`, using the same merge rule — e.g. if the
   project already has a `main.tsx` or a router of its own, wire the
   registry/routing into it instead of replacing it.

Detection is contract-level: a project with these files under different
formatting, extra dependencies, or additional files still counts as having
the anchor. Do not overwrite an anchor that is already present just because
it differs cosmetically from the template.

## Monorepo detection

Treat the project as a monorepo, and scaffold into a self-contained
`presentations/` app instead of the root, when any of:
- `package.json` has a `workspaces` field.
- `pnpm-workspace.yaml` exists.
- The root has both a `packages/` or `apps/` directory and no build anchor of
  its own at the root.

Otherwise (empty directory, or a standalone non-monorepo project) scaffold at
the repository root.

## Dependency set

Never assume a dependency already exists — install the full set the
scaffold requires, matching `templates/bootstrap/package.json`:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Dev/build: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`, `eslint`, `@eslint/js`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`,
  `typescript-eslint`, `playwright`.

Do not add Tailwind, a Tailwind Vite plugin, or any other styling framework
unless the host project already depends on one or the user explicitly asks
for it. The scaffold ships zero palette/typography/spacing/border/shadow/
card/button/theme defaults — that's the presentation's job, in its own CSS.

## Template resolution

Resolve every template path relative to this skill's own directory (the
directory containing `SKILL.md`), e.g.
`path.join(skillDir, 'templates/bootstrap')` — never relative to the
current working directory, so the skill behaves the same regardless of where
the agent was invoked from.

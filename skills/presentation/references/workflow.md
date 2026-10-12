# Workflow reference

This file owns the detailed discovery, targeting, merge, and verification
procedures. The short sequence in `SKILL.md` points here so these rules have one
source of truth.

## Gather requirements

Skip questions already answered. Otherwise ask one question at a time for the
topic, visual style, and each step's content and visual description. An ASCII
sketch is optional for a key or complex layout. If the user asks to proceed
with partial detail, accept that and make conservative choices; do not impose
a completeness gate.

For an ambiguous modification, list the existing talks and ask which one. Once
selected, ask only about the requested changes; do not repeat the creation
interview.

## Resolve the target

Inspect the project before writing. Treat a project as a monorepo if root
`package.json` has `workspaces`, `pnpm-workspace.yaml` exists, or root
`packages/` or `apps/` exists. A fully scaffolded presentation app is the
target if present. Otherwise target the root for an empty or standalone
project, and a self-contained `presentations/` child app for a monorepo. Do not
mutate monorepo root configuration.

### Contract anchors

Run `rg --files -g 'package.json' -g 'vite.config.*' -g 'tsconfig*.json' -g
'src/**' -g 'presentations/**'` and inspect the matches. Use these concrete
signals:

1. **Build setup:** In the target `package.json`, find `scripts.build` and
   React, TypeScript, and Vite dependencies. In `vite.config.*`, find
   `@vitejs/plugin-react`. Confirm by running `npm run build` when the setup
   exists but its health is unclear.
2. **Scene kit:** Search source files for exports/imports named `Step`, `Scene`,
   and `Presentation`, then inspect the referenced modules for a stage/host,
   navigation, chrome, and fit-scale canvas. Check that their imports resolve.
3. **Presentation registry:** Search for a registry that maps slugs to
   presentation loaders, then inspect its router for slug resolution. Typical
   signals include `import(`, `lazy(`, `presentations`, and route parameters.

Reuse anchors that satisfy the contract. If an anchor is absent or partial,
merge only its missing contract:

1. Identify exactly which files, dependencies, exports, or registry entries
   are missing.
2. Add missing files without replacing existing files. For an existing file,
   make the smallest additive edit and preserve its exports, configuration,
   versions, and unrelated entries.
3. Resolve name or behavior conflicts by adapting the new integration to the
   host's established pattern. Do not overwrite a file or talk to make an
   anchor fit. If the existing contract cannot support the integration,
   describe the incompatible signals and stop before writing that integration.
4. Reinspect the changed anchors and run the target build.

For any non-empty project missing the scene kit or presentation registry,
state the exact target path and wait for explicit confirmation before writing.
For an empty project, scaffold directly.

## Scaffold and author

Copy bootstrap files from `templates/bootstrap/` and talk files from
`templates/presentation/`, resolving paths relative to the skill directory.
Install the full dependency set from the bootstrap manifest using
`npm install` (or the host's package manager); do not assume dependencies are
already installed. Preserve unrelated files, existing talks, and working host
configuration. Keep the kit style-neutral. Its minimal starter talk exists to
make verification work: replace it for a newly requested talk, or retain it
unless the user requested otherwise.

For an existing app, read the registry (`index.ts` or its equivalent), one
existing talk's `Talk.tsx`, `entities.ts`, and a step module. Note the import
paths, entity ID prefixing, CSS file and class naming, and registry entry
format, then match those conventions.

Create one unique slug folder containing `entities.ts`, `steps/`, `Talk.tsx`,
and local plain CSS; register exactly one new loader. Do not change other talks
while creating a new one. Keep the kit generic and put presentation visuals in
the talk's CSS.

The bootstrap guarantees runtime dependencies `react`, `react-dom`, `motion`,
and `lucide-react`; and development/build dependencies `vite`,
`@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
`@types/node`, `eslint`, `@eslint/js`, `typescript-eslint`,
`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, and
`playwright`. When merging an existing manifest, add missing dependencies and
scripts while preserving existing versions and configuration.

## Verify and inspect

1. Run `npm run build`.
2. Run `npm run verify` for browser rendering and navigation checks.
3. Run `npm run inspect -- <slug>` and locate the generated screenshots.
4. Review every warning. Fix accidental collisions, distinguish active ToC and
   progress states, and make attribution legible in presentation-owned CSS.
   Annotate overlaps only when they are intentional and readable.
5. View settled screenshots for the first, last, and densest or key steps. View
   a narrow viewport when responsive behavior matters. Check the first render
   for runtime and console errors, and verify captions plus next/previous
   navigation on every step.
6. If a command fails, a warning reveals an unintended result, or a screenshot
   shows a composition defect, fix it and return to step 1. Repeat the full
   loop until the build and verification pass and inspection warnings are
   resolved or explicitly understood.
7. Report using the format in `SKILL.md`: commands and results, screenshot
   paths, warnings, and the talk slug and route. Never claim an unobserved
   result.

Check evolving-scene continuity: persistent entities keep stable IDs and morph
in place, new entities enter after continuing motion settles, departing
entities exit, and adjacent states share a scene group when they continue the
same composition. Accumulate-only composition is specific to the sample, not a
general rule for generated talks.

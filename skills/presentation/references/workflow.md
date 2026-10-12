# Workflow details

## Contract anchors

Check cheaply and structurally rather than requiring byte-identical files:

1. **Build setup:** `package.json` has a working `build` script and React,
   TypeScript, Vite dependencies; a Vite config uses the React plugin. If
   uncertain, run `npm run build`.
2. **Scene kit:** identify a module exporting the `Step`/`Scene` contract and
   `Presentation`, plus a stage/host, navigation, chrome, and fit-scale canvas.
   Confirm its imports resolve.
3. **Presentation index:** locate a registry mapping slugs to presentation
   loaders and a router that resolves those slugs.

The guaranteed dependencies are runtime `react`, `react-dom`, `motion`,
`lucide-react`; dev/build `vite`, `@vitejs/plugin-react`, `typescript`,
`@types/react`, `@types/react-dom`, `@types/node`, `eslint`, `@eslint/js`,
`typescript-eslint`, `eslint-plugin-react-hooks`,
`eslint-plugin-react-refresh`, `globals`, and `playwright`. Merge missing
dependencies and scripts while preserving existing versions and configuration.

## Target and safety

Resolve the working app before writing. Existing fully scaffolded presentation
app wins. Otherwise empty and standalone targets use root; monorepos signaled by
`workspaces`, `pnpm-workspace.yaml`, `packages/`, or `apps/` use a standalone
`presentations/` child app. For any non-empty project where the kit or registry
is missing, state the target path and wait for explicit confirmation before
writing. Never overwrite existing files or talks to make an anchor fit; merge
the missing contract and report incompatibilities.

Bootstrap and presentation template paths are relative to the directory of
`SKILL.md`. Copy the bootstrap snapshot to the selected app, then install with
`npm install` (or the host's package manager). Its starter presentation exists
so build and verification work immediately. Replace it only when the requested
work is the starter itself; otherwise keep it registered and intact.

## Create and modify

Gather only unanswered requirements, one question at a time. Ask topic, visual
direction, then per-step content and visual description. Explicit permission to
build with partial detail is enough; make conservative choices and invite
iteration in the result. For an unclear modification, first enumerate routes
and ask which talk. Then ask only the requested edit details.

Create a unique slug folder with entities, step modules, talk entry, and local
CSS. Register exactly one new loader line. Keep the kit generic and do not edit
other talks. See `../templates/presentation/` for starter files.

## Completion report

Run build, full browser verification, and local inspection. Review the first,
last, and densest/key step screenshots, plus narrow view when relevant. Fix
errors and accidental overlap; make active chrome distinguishable and
attribution legible using local styling. Only annotate genuinely intentional,
readable overlaps. Report commands, observed result, screenshots location, and
any remaining advisory warnings accurately.

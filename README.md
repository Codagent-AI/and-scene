# and-scene

A Claude Code **skill** that builds **evolving-scene presentations** into your own
project — and a reusable scene kit it brings with it.

An evolving-scene presentation is not a stack of unrelated slides. It is one
shared diagrammatic canvas where a stable set of entities **morph** across named
steps: boxes appear, move, connect, collapse, and re-label as the talk arc
develops. The continuity between steps *is* the story.

This repo also contains a worked **reference talk** you can run locally to see the
format in action — see [Development](#development) at the bottom.

## Getting started

You use and-scene by installing its **plugin** and running its skill inside
**your** project. It does not require this repo at runtime, and **there is no npm
package to install** — the scene kit is vendored into your project by the skill
(see [How the kit reaches your project](#how-the-kit-reaches-your-project)).

### 1. Install the plugin

```bash
claude plugin marketplace add Codagent-AI/and-scene
claude plugin install and-scene
```

> Plugin packaging is being finalized.

### 2. Create a presentation

Invoke the skill in your project:

```text
/and-scene:presentation
```

…or just ask in natural language (e.g. "create a presentation about …"). The
skill interviews you one question at a time, scaffolds any missing infrastructure
(stating the target and asking before it writes), generates the presentation, and
self-verifies that it builds and renders.

### 3. Work on the result

Scaffolding gives your project a Vite + React app with the usual scripts:

```bash
npm run dev        # http://localhost:5173
```

The dev server opens a **landing page** at `/` listing every presentation; each
lives at its own route (`/<slug>`).

## Updating

```bash
claude plugin marketplace update and-scene
claude plugin update and-scene@and-scene
```

## How the kit reaches your project

There is **no `npm install and-scene`**. The reusable **scene kit**
(`presentation-kit/`, ~650 lines) is **vendored** — the skill *copies* it into
your project as source you own and can edit, like
[shadcn/ui](https://ui.shadcn.com). You're meant to tweak its branding, colors,
and node primitives.

### Where the skill scaffolds

When your project is missing the presentation infrastructure, the skill resolves
*where* to put a self-contained app, then states the target and asks you to
confirm before writing:

| Your project | Scaffold location |
|--------------|-------------------|
| Empty directory, or an existing standalone JS app (root `package.json`) | Repository root (`.`) |
| Monorepo (`workspaces`, `pnpm-workspace.yaml`, or `packages/` / `apps/`) | Self-contained app under `presentations/` |
| Non-empty repo that is **not** a JS app (no root `package.json` — e.g. Python/Go/Rust) | Self-contained app under `presentation/` |
| Already has the infrastructure | Uses it in place; scaffolds only what's missing |

## Controls

Each presentation lives at its own route (`/<slug>`). In a presentation:

- **→ / Space / PageDown** — next step
- **← / PageUp** — previous step
- **P** — toggle **present** (title-only) ↔ **browse** (captions + table of
  contents). The step **title shows at the top in both modes**; browse adds the
  per-step caption and navigation along the bottom.

## Scripts

Scaffolding adds these to your project:

| Script | What it does |
|--------|--------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run verify` | Build + render-check every registered presentation |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |

`verify` builds the app, then launches a headless browser against a production
preview and steps through **every** registered presentation, failing on any build
error, console error, or uncaught page error. (It needs a Chromium browser — run
`npx playwright install chromium` once.)

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 · [`motion`](https://motion.dev)
for `layoutId` morph animations · `lucide-react` for glyphs.

---

## Development

### Run the reference app

```bash
npm install
npm run dev        # http://localhost:5173
```

The landing page at `/` lists every registered presentation. The bundled
reference talk — which itself explains how the skill builds a talk — lives at:

```
http://localhost:5173/how-to-make-a-presentation
```

Run `npm run verify` to build and render-check every presentation, and
`npm run test` for the unit tests.

### Repository layout

```
src/                         The reference app
  presentation-kit/          CANONICAL scene kit: Presentation, Stage, chrome,
                             node primitives (Box, Arrow, Frame, …), navigation
  presentations/
    index.ts                 Registry — one entry per presentation (slug → loader)
    <slug>/                  A self-contained presentation (entities/steps/Talk)
  Root.tsx, router.ts        Zero-dependency pathname router + landing page
scripts/verify.mjs           Build + render verification (Playwright)

skills/presentation/         The agent skill
  SKILL.md                   The skill contract + procedure
  scaffold.ts                Anchor detection + scaffold-target resolution
  templates/
    bootstrap/               A full app shell, incl. a SNAPSHOT COPY of the kit,
                             stamped into a fresh/empty project
    presentation/            A single-presentation template
    single-step/             A single-step template
```

### Two copies of the kit, on purpose

`src/presentation-kit/` is the canonical kit the reference app runs.
`skills/presentation/templates/bootstrap/src/presentation-kit/` is a snapshot the
skill copies into your project. They are kept byte-identical (excluding tests) —
when the canonical kit changes, the snapshot must change identically.

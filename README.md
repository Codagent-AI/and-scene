# and-scene

A browser app for building **evolving-scene presentations** — and an agent
skill that generates them for you.

An evolving-scene presentation is not a stack of unrelated slides. It is one
shared diagrammatic canvas where a stable set of entities **morph** across named
steps: boxes appear, move, connect, collapse, and re-label as the talk arc
develops. The continuity between steps *is* the story.

The app ships a reusable **scene kit** (`src/presentation-kit/`), a registry of
presentations (`src/presentations/`), and a worked reference talk —
[How to Use This Skill to Make a Presentation](src/presentations/how-to-make-a-presentation)
at the `/how-to-make-a-presentation` route, which itself explains how the skill
builds a talk.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server opens the **landing page** at `/` — an index that lists every
registered presentation. It does *not* jump straight into a talk. Click a
presentation, or go to its route directly, to open it. The bundled reference
talk lives at:

```
http://localhost:5173/how-to-make-a-presentation
```

Each presentation lives at its own route (`/<slug>`). In a presentation:

- **→ / Space / PageDown** — next step
- **← / PageUp** — previous step
- **P** — toggle present (titles) ↔ browse (captions + table of contents)

## Repository layout

```
src/
  presentation-kit/        Reusable scene kit: Presentation, Stage, chrome,
                           node primitives (Box, Arrow, Frame, …), navigation
  presentations/
    index.ts               Registry — one entry per presentation (slug → loader)
    <slug>/                A self-contained presentation
      entities.ts          Stable layoutId namespace for morphing entities
      steps/*.tsx          One file per step
      Talk.tsx             Composes the steps into <Presentation />
  Root.tsx, router.ts      Zero-dependency pathname router + landing page
scripts/verify.mjs         Build + render verification (Playwright)
skills/presentation/       The agent skill that generates presentations
```

## The presentation skill

`skills/presentation/` is a Claude Code skill that builds and modifies these
presentations end to end. Given a topic, it:

1. **Gathers requirements** interactively — one question at a time (topic,
   visual style, and the content + visual description of each step), and may
   sketch ASCII mockups for complex steps.
2. **Scaffolds if needed** — detects whether the build setup, scene kit, and
   presentation registry are present, and bootstraps whatever is missing
   (monorepo-aware: scaffolds into `presentations/` when appropriate).
3. **Generates or modifies** a presentation as a self-contained folder under
   `src/presentations/<slug>/`, registered at its own route.
4. **Self-verifies** — builds and renders the result, fixing failures before
   reporting done.

See [`skills/presentation/SKILL.md`](skills/presentation/SKILL.md) for the full
contract, node primitives, and step model.

## Adding a presentation by hand

If you'd rather not use the skill:

1. Copy `skills/presentation/templates/presentation/` to
   `src/presentations/<slug>/` and fill in `entities.ts`, `steps/*.tsx`, and
   `Talk.tsx`.
2. Add one entry to `src/presentations/index.ts`:

   ```ts
   {
     slug: 'my-talk',
     title: 'My Talk',
     load: () => import('./my-talk/Talk'),
   }
   ```

3. Run `npm run verify`.

## Verification

```bash
npm run verify
```

`verify` builds the app, then launches a headless browser against a production
preview and steps through **every** registered presentation, failing on any
build error, console error, or uncaught page error. A presentation registered
but broken will fail the check.

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run verify` | Build + render-check every registered presentation |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 · [`motion`](https://motion.dev)
for `layoutId` morph animations · `lucide-react` for glyphs.

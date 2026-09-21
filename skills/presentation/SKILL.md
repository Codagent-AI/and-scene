---
name: presentation
description: Creates and modifies browser presentations as evolving scenes. Activates for requests to create a browser presentation, edit presentation steps, or animate a diagram using the scene kit.
---

# Presentation skill

Use this skill to create or modify a routed presentation built with the local
scene kit. A presentation is one diagram that changes through named steps; it
is not a collection of unrelated slides.

## Gather requirements

Ask one question at a time. Do not fill in details the user can still provide.
For a new presentation, gather:

1. The topic, audience, and desired outcome.
2. The visual direction: mood, palette, typography, density, and any references.
3. For each step: era/section, presenter title, browse caption, the entities or
   connections that should be visible, and the intended positions or transition.

If the user has already supplied an answer, skip that question. The user may
choose to proceed with partial detail; record unknowns as small, reversible
design decisions and continue. For a key or complex layout, an ASCII sketch is
allowed as a confirmation aid, but never require one for every step.

For a modification, identify the target before editing. If the request does
not name a unique presentation, list the registered presentations and ask which
one to change. Once selected, ask only about the requested steps, entities, or
style change; do not repeat the full create interview.

## Resolve and bootstrap the project

Resolve this file's directory first. Templates are always relative to it:

```text
SKILL.md -> templates/bootstrap/
SKILL.md -> templates/presentation/
SKILL.md -> templates/step/
```

Inspect the target for these contract anchors rather than matching filenames or
bytes:

- build: `package.json` with Vite, React, TypeScript, and a working `build`
  script;
- kit: `src/presentation-kit/types.ts` exporting `Step` and `SceneProps`, plus
  a stage/host with navigation and chrome;
- registry: `src/presentations/index.ts` exporting presentation entries with
  route slugs and loaders.

If all anchors exist, reuse them. If some are missing, copy only the missing
bootstrap portions and preserve existing files. The bootstrap is styling
framework-neutral. Install the dependencies declared by the selected target's
package: React, React DOM, Vite, TypeScript, Motion, Lucide, ESLint, and
Playwright. Never add Tailwind or another styling framework unless the host
already uses it or the user explicitly requests it.

Choose the target before writing:

- empty or standalone project: repository root;
- monorepo (workspaces, `pnpm-workspace.yaml`, or an `apps/`/`packages/`
  layout): `presentations/` as a self-contained app;
- non-empty project missing kit or registry: state the resolved target and get
  confirmation before writing.

Resolve all template paths from the skill directory, not the process working
directory. The reusable kit snapshot must remain free of palette, typography,
spacing, border, shadow, card/button, and theme defaults. Put visual treatment
in the presentation's CSS or the host app.

## Create or modify

Create a new folder under `src/presentations/<slug>/` (or the target app's
equivalent) containing a `Talk.tsx`, `entities.ts`, `steps/`, and presentation
owned CSS. Use the step template for each step. Register exactly one lazy entry
in `src/presentations/index.ts`; do not overwrite existing entries.

Each step needs a stable `id`, `era`, `title`, `caption`, typed `payload`, and a
scene. Give continuing entities stable `layoutId`/`entityId` values. Use a
shared `groupKey` for successive states of the same scene so the scene updates
in place. New entities should use the kit's delayed `Appear` behavior after
persisting entities settle; departing entities should be removed from the next
state. Intentional overlaps are allowed when they remain readable and are
marked for the local inspection helper.

For a modification, edit only the selected presentation and the necessary
registry or verification files. Preserve every other presentation and route.

## Verify before reporting success

Run the target project's build and lint. Then use its local verification or
inspection helper when available; otherwise create temporary helpers under the
project root. Start preview on `127.0.0.1`, render at least the first step, and
inspect settled screenshots of the first, last, and densest/key steps. Also use
a narrow viewport when the composition is responsive-sensitive. Review every
warning: fix accidental chrome/text collisions, indistinct active state, and
unpolished attribution; use an explicit allow-overlap marker only for a
readable intentional overlap. Re-run failed checks after fixing them. Do not
report completion while build, render, or visual checks fail.

The project-local helper is preferred because it uses local browser dependencies
and settled captures. Run `npm run verify -- <slug>` to verify the selected
presentation (or all registered presentations when no slug is supplied), and
run `npm run inspect -- <slug>` to capture the selected presentation's
per-step settled screenshots and advisory warnings. The inspection helper
builds, starts its own `127.0.0.1` preview, and shuts it down again, so no
preview needs to be running first. A successful completion
report names the route, build, render, and visual inspection results, plus any
advisory warnings that remain.

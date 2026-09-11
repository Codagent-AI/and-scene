# Task: Presentation skill

## Goal

Author the local presentation skill used to create and modify evolving-scene
presentations. It consists of a `SKILL.md` procedure plus templates. The skill
gathers requirements, bootstraps missing infrastructure, generates or modifies
presentations, registers them, and verifies build, render, and visual composition
before reporting success.

## Required reading

Before starting, read:

- `openspec/changes/create-and-scene/specs/presentation-skill/spec.md` — the
  authoritative behavioral contract
- `openspec/changes/create-and-scene/design.md` — architecture, target resolution,
  and style ownership
- `openspec/changes/create-and-scene/test-plan.md` — especially INT-001 and the
  public skill flows AT-001, AT-002, and AT-004
- all of `src/presentation-kit/` — the engine the skill composes
- `src/presentations/index.ts`, `src/main.tsx`, `package.json`, and
  `vite.config.ts` — registration, routing, and build setup

## Implementation

Create `skills/presentation/` with:

- `SKILL.md` for one-question-at-a-time gathering, partial-detail opt-in,
  create/modify routing, verification, and completion reporting
- templates for a presentation, a step, and a complete bootstrap app/scene kit
  used when required contract anchors are missing

The procedure must:

1. Gather topic, visual style, and per-step content/visual intent without assuming
   details the user can still provide. Permit building from partial details.
2. Detect the build setup, scene kit, and presentation-index anchors at the
   contract level. Scaffold only what is missing and resolve templates relative
   to the skill directory.
3. Target the repository root for empty/standalone projects and a self-contained
   `presentations/` app for monorepos. Confirm the target before writing into a
   non-empty unscaffolded project.
4. Install required React, Vite, TypeScript, Motion, Lucide, lint, and Playwright
   dependencies. Do not add Tailwind or another styling framework unless the host
   already uses it or the user requests it.
5. Keep the reusable kit template free of palette, typography, spacing, border,
   shadow, card/button, and theme defaults. Presentation-owned plain CSS is the
   default place for a generated visual design.
6. Create self-contained routed presentations without disturbing existing ones;
   scope modifications to the selected presentation and requested changes.
7. Build, render, and visually inspect the required steps, fixing failures before
   reporting completion. Prefer the project-local screenshot helper.

Deliver the automated coverage needed by INT-001 for materializing the bootstrap
outside this repository, proving its anchors and dependency contract, building
it, and checking canonical/template kit parity without imposing a style system.
Keep the skill and templates usable by the AT-001, AT-002, and AT-004 flows; the
separate acceptance phase runs those flows after task 03 completes the system.

## Acceptance criteria

The canonical scenarios in
`openspec/changes/create-and-scene/specs/presentation-skill/spec.md` are
authoritative. This task deliberately does not duplicate that spec.

## Done When

`skills/presentation/SKILL.md` and its templates fully encode the canonical
procedure. A materialized bootstrap template builds without Tailwind, contains no
kit-owned visual defaults, resolves its own templates independent of the working
directory, and provides the required local verification and screenshot helpers.
INT-001 passes, and the delivered public workflow contains no gaps that would
prevent AT-001, AT-002, or AT-004 from running after task 03.

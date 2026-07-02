# Task: Reference sample (via the skill) + verification

## Goal

Produce the committed reference presentation — the self-referential talk **"How to
Use This Skill to Make a Presentation"** — by **loading and following the
presentation skill's own procedure**, then add the verification entry point
(`npm run verify`) that builds the whole app and renders the sample through every
step in a real browser. This task dogfoods the skill: building a real presentation
is how we confirm the skill and the scene kit actually work.

## Background

This repo (`and-scene`) is a Vite + React 19 + TypeScript app. The reusable
presentation engine (the "scene kit") lives at `src/presentation-kit/`, with an
explicit registry at `src/presentations/index.ts` and a zero-dep pathname router in
`src/main.tsx` (each presentation lives at `src/presentations/<slug>/` and is
reachable at `/<slug>`). The presentation skill lives at `skills/presentation/`.

**Important — the skill is NOT auto-loaded in this session.** You are a fresh agent
without the skill registered. Before generating the sample you MUST **read and
follow the skill procedure at `skills/presentation/SKILL.md`** (and its
`skills/presentation/templates/`) explicitly, as if it were loaded. Do not
improvise a different process — exercise the skill's actual documented procedure so
this task genuinely tests it.

You MUST read these files before starting:
- `skills/presentation/SKILL.md` and `skills/presentation/templates/` — the
  procedure you will follow and the templates you will use.
- `openspec/changes/create-and-scene/specs/presentation-verification/spec.md` — the
  acceptance criteria, including the normative sample step outline (also copied
  verbatim below). **Use the table's topic, era/title/caption, and scene content as
  your answers to the skill's gathering questions** — you are playing both the
  skill operator and the human supplying the brief. The per-step visual design is
  yours to design (it is deferred to this stage).
- `openspec/changes/create-and-scene/design.md` — see the verification section
  (`vite preview` + Playwright/Chromium driver using the chrome's step hooks) and
  the scene-kit composition guidance.
- `src/presentation-kit/` (all files) — the primitives and `Presentation` entry the
  sample composes; the chrome exposes `data-step-count` / `data-step-index`
  attributes the render check relies on.
- `src/presentations/index.ts`, `src/main.tsx`, `package.json` — registration,
  routing, and where the `verify` script/dependency land.

**The skill (and the kit) are welcome to improve.** If, while following the skill
to build the real sample, you find the skill procedure or templates unclear,
underspecified, or missing steps — OR you find the scene kit
(`src/presentation-kit/`) lacks a primitive/capability the sample genuinely needs —
fix `skills/presentation/**` and/or `src/presentation-kit/**` as part of this task,
rather than working around the gap. Keep such changes minimal and in the spirit of
the existing design. Note what you changed and why in your final report.

**Verification to add (per the design):** a `scripts/verify.mjs` invoked by an
`npm run verify` script that:
1. Runs the whole-app build (`npm run build`); any type/build error fails.
2. Asserts the reference sample is present in `src/presentations/index.ts`.
3. Runs `vite preview`, then drives Chromium via Playwright to the sample route,
   reads the step count from the chrome's `data-step-count` hook, and steps through
   every step (advancing and checking `data-step-index`).
4. Fails on any `console.error`, uncaught `pageerror`, or failed step transition,
   reporting the failing step index.
5. Exits non-zero on any failure (machine-readable for evals).

Add `playwright` as a dev dependency if not already present, and ensure the verify
flow can install/run Chromium.

## Spec

### Requirement: Build verification
Verification SHALL build the whole application — all presentations plus the index — and fail if the build does not succeed.

#### Scenario: Build must succeed
- **WHEN** verification runs
- **THEN** it builds the whole app and fails if `npm run build` reports any type or build error

### Requirement: Committed reference sample
A generated sample presentation SHALL be committed in the repository as a known-good fixture, registered and reachable like any other presentation.

The sample is the self-referential talk **"How to Use This Skill to Make a Presentation"** — a presentation, built by the skill, about building presentations with the skill. Its closing beat reveals that the viewer is looking at an example of the skill's own output. The sample SHALL implement the following steps (titles, captions, and scene intent are normative; the per-step visual design is deferred to design):

| # | Era | Title (present) | Caption (browse) | Scene content |
|---|-----|-----------------|------------------|---------------|
| 1 | the ask | "You have a topic" | It starts with you, a topic, and mild overconfidence. | A **you** entity and a **prompt** bubble appear. |
| 2 | the ask | "The skill interviews you" | One question at a time: topic, visual style, every step. | A **skill** node appears; a question-loop arrow connects skill↔you, questions popping one at a time. |
| 3 | the gathering | "Answers become steps" | Each answer is captured as a step — content plus a visual description. | **Step-cards** accumulate and stack as answers land. |
| 4 | the gathering | "You set the depth" | Specify everything, or just a few and see how it looks. You hold the gate. | The stack shows partial vs. full; a control on **you** governs how much is captured. |
| 5 | the build | "It assembles the scene" | Your steps are wired into reusable scene components — one folder, one route. | A **scene-kit** node connects; step-cards + kit merge/collapse into a **presentation route** box. |
| 6 | the build | "It checks its own work" | Before saying done, it builds and renders — and fixes what breaks. | A **verify** node connects to the route; build + render checks resolve to a green check. |
| 7 | the loop | "Changed your mind? Loop it." | Point at the result and ask for changes. The skill edits in place. | A **modify** arrow loops from the route back to the gathering. |
| 8 | the reveal | "You're looking at one" | This presentation was built exactly this way. Thanks for watching. | A frame draws around the whole diagram, labeled — self-reference reveal. |

#### Scenario: Sample exists and matches the outline
- **WHEN** verification runs
- **THEN** it confirms the committed reference sample presentation exists, is registered/reachable, and implements the eight steps above in order

#### Scenario: Missing sample fails
- **WHEN** the reference sample is absent
- **THEN** verification fails

### Requirement: Render verification
Verification SHALL render the reference sample through all of its steps and fail if any step produces a runtime or console error. The render check runs the sample in a real browser against a production preview and steps through every step. (Mechanism settled in design: `vite preview` + a Playwright/Chromium driver that enumerates steps via the chrome's step-count hook.)

#### Scenario: Every step renders cleanly
- **WHEN** verification renders the sample
- **THEN** it steps through every step and asserts each renders without runtime or console errors

#### Scenario: Console or page error fails verification
- **WHEN** the sample emits a console error or an uncaught page error while stepping through it
- **THEN** verification fails and identifies the failing step

#### Scenario: Step error fails verification
- **WHEN** any step errors during render
- **THEN** verification fails and identifies the failing step

### Requirement: Pass/fail reporting
Verification SHALL produce an unambiguous pass/fail outcome suitable for automated evals.

#### Scenario: Clear outcome
- **WHEN** verification completes
- **THEN** it reports a clear pass or fail (non-zero exit on failure) identifying which check failed

## Done When

The reference sample exists under `src/presentations/how-to-make-a-presentation/`
(produced by following `skills/presentation/SKILL.md`), is registered in
`src/presentations/index.ts`, and implements the eight steps above in order.
`npm run verify` builds the whole app, confirms the sample is registered, and steps
a real browser through every step — passing with exit 0 and failing non-zero (with
the offending step) on any build error, missing sample, console error, or page
error. Any skill/kit improvements made along the way are described in the final
report.

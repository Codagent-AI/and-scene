---
name: presentation
description: Create browser-based presentations as one evolving scene. Use when asked to make, create, or build a presentation, slide deck, talk, animated explainer, or step-by-step diagram/walkthrough; or to edit an existing presentation or add steps. Keywords: presentation, slides, deck, scene, steps, And Scene, scene kit.
---

# Presentation

Create browser presentations as one diagram that evolves through named steps. Use the shared scene kit for behavior and geometry; each presentation owns its content and visual design.

## 1. Identify the request

Decide whether the user wants a new presentation or a change to an existing one. For a modification, inspect the registry first. If the target is missing or ambiguous, list the registered presentations and ask which one to change before editing. Once selected, ask only about the requested change; do not repeat the create interview.

## 2. Gather requirements for a new presentation

Use the details already supplied. Ask one concise question at a time for missing information, in this order:

1. Topic or central idea.
2. Visual style and intended audience, if not already clear.
3. Ordered steps. For each step, establish its title or point, caption/narration, visual content and what appears, moves, connects, or changes from the previous step.

Do not invent details the user can still provide. Let the user choose the number and depth of steps. If the user explicitly wants to proceed with partial detail, build from the captured information, make only necessary implementation choices, and leave room to iterate. Do not impose a completeness gate. Offer an ASCII sketch when a step has more than three interacting entities or uses an unfamiliar layout; use it to confirm the key composition. The user may provide all details in one prompt, in which case proceed without redundant questions.

## 3. Resolve the target and ensure infrastructure

Work inside the requested repository. Resolve this skill's directory from the location of this `SKILL.md`; resolve all linked template paths from that directory, never from the caller's current working directory.

Follow these steps in order:

1. **Detect anchors.** Check contract-level presence of the three anchors:
   - **Build setup:** Vite + React + TypeScript and a working `npm run build`.
   - **Scene kit:** typed `Step`/`Scene` contract, active-step stage with entity continuity/morphs, present/browse navigation and chrome, and fixed fit-scale canvas.
   - **Presentation index:** explicit registry mapping slugs to presentation modules/routes.

   Recognize anchors by their contracts, not exact filenames, formatting, or byte identity. Scaffold only missing anchors and dependencies; preserve existing files and presentations.
2. **Choose a target.** Use the repository root for an empty directory or standalone project. In a monorepo (workspace declaration, `pnpm-workspace.yaml`, or `packages/` / `apps/` layout), use a self-contained app under `presentations/`. If already inside a presentation app with anchors, use that app.
3. **Confirm before writing when required.** For a non-empty, unscaffolded project, state the resolved target and ask the user to confirm before writing. Do not ask again when the user has already confirmed that target. In a partial monorepo, preserve its existing build setup and unrelated root content; put missing presentation infrastructure in the self-contained `presentations/` app.
4. **Copy only missing pieces.** Use the [bootstrap app and scene kit](templates/bootstrap/) as the complete scaffold reference. Use the templates below for new presentation files. Merge selectively; never overwrite an existing anchor or unrelated content.
5. **Install dependencies.** Ensure and install the dependencies in [templates/bootstrap/package.json](templates/bootstrap/package.json) after updating the target manifest and lockfile. This manifest includes React, Vite, TypeScript, Motion, Lucide, lint, test, and Playwright dependencies. Do not add Tailwind or another styling framework unless the host already uses it or the user requests it.

### Template map

| Template | Purpose | Destination |
| --- | --- | --- |
| [templates/bootstrap/](templates/bootstrap/) | Complete app, routing, registry, style-neutral scene kit, local build/browser verification, and screenshot inspection helpers | Scaffold target root |
| [templates/presentation/](templates/presentation/) | `Talk.tsx`, stable entity namespace, starter step list, and presentation-owned CSS | `src/presentations/<slug>/` |
| [templates/step/step.tsx](templates/step/step.tsx) | One typed step/scene module; combine it with `templates/presentation/entities.ts` and adjust relative imports | `src/presentations/<slug>/steps/<name>.tsx` |

The presentation template provides `entities.ts` for stable IDs, `steps/index.tsx` as the initial step collection, and `style.css` for the presentation's design. Keep the kit style-neutral: do not add its palette, typography, spacing, borders, shadows, cards, buttons, theme tokens, or visual defaults. Plain CSS owned by the presentation is the default.

## 4. Discover local conventions

Before creating a new presentation, read the presentation registry and, when one exists, one registered presentation's `Talk.tsx`, step modules, entity IDs, and CSS. Match local slug, file layout, import, and styling conventions while preserving the style-neutral kit contract. If no presentation exists yet, follow the [presentation template](templates/presentation/) conventions.

## 5. Create or modify

For a new presentation, create a self-contained folder under `src/presentations/<slug>/` and register one explicit `{ slug, title, load }` entry. Compose generic kit primitives. Reuse stable entity IDs for concepts that persist between steps; give steps a shared group key when a scene instance should update in place. New entities enter after continuing elements settle; departing entities have a readable exit. Keep the scene as an accumulation/evolution rather than independent slide redraws.

For a modification, edit only the selected presentation and the registration or host files strictly required by the requested change. Keep the kit generic.

Use the template files in the map above, replacing every placeholder. Give every step a concise title and useful caption. The kit's `DESIGN_W` and `DESIGN_H` in `src/presentation-kit/constants.ts` set the default 880 × 380 canvas: this fixed coordinate space keeps the scene composition stable while it scales to fit. Keep that default unless the design needs a different aspect or working area; pass an explicit size with `<Presentation designSize={{ width: 1000, height: 500 }} ... />` when needed.

## 6. Verify before reporting completion

Run the host's build (`npm run build`) and fix failures. Open the generated route in the project's real browser render check when available (prefer `npm run verify`; otherwise use the bootstrap's `npm run verify -- <route>`). At minimum, the first step must render without runtime or console errors. Then use the project-local screenshot helper (`npm run inspect -- <slug>`); do not write a temporary helper outside the project. Let it settle transitions and capture all steps.

Review the first, last, and densest or key step screenshots; also inspect a narrow viewport when the composition is responsive-sensitive. Review overlap, active progress/ToC distinction, and attribution warnings. Fix accidental collisions and indistinct active controls; mark overlap as allowed only when intentional and readable. Rebuild, re-render, and re-inspect after fixes. Prefer the full project verification command when it exists.

## Out of Scope

- Exporting PPTX, PDF, video, or image decks. Use a dedicated export or slide-authoring tool for those formats.
- Adding a styling framework by default; keep plain CSS unless the host already uses one or the user requests one.
- Modifying the shared scene kit for one presentation's content or style. Put those changes in the presentation; propose a separate shared-kit change when needed.
- Deploying or hosting presentations. Use the project's deployment workflow when the user requests publishing.
- Building disconnected slide-per-page decks without scene continuity. Use a conventional slide-authoring tool when that format is required.
- Editing a presentation the user has not selected when the target is ambiguous. First identify the target.

## Output

Structure a generated presentation like this, adapting the step-module count to the content:

```text
src/presentations/<slug>/
├── Talk.tsx
├── entities.ts
├── style.css
└── steps/
    ├── 01-<step>.tsx
    └── ...
```

Add a registry entry shaped like:

```ts
{ slug: '<slug>', title: '<presentation title>', load: () => import('./<slug>/Talk') }
```

Report completion in this format, with factual results:

```text
Route: /<slug>
Files: <created or modified paths>
Checks: <build, browser render, screenshot/visual review>
Warnings: <remaining advisory warnings, or none>
```

Do not report completion while a build or render failure remains.

---
name: presentation
description: Builds browser presentations modeled as one evolving diagram - a scene whose entities move, appear, and morph through named steps. Use when the user asks to make, create, add, or modify a presentation, deck, or talk built on this scene model. Gathers the topic, style, and step details interactively, scaffolds a Vite + React app with the scene kit if the project lacks it, generates or edits the presentation, and verifies the build and the rendered result before reporting done.
---

# Presentation skill

This skill produces one presentation per route. Each presentation is a folder of
plain TypeScript and CSS that runs on the scene kit (`presentation-kit`): one shared
scene component, a list of steps that change its payload, and a presentation-owned
stylesheet.

## Paths

Everything under `templates/` and `scripts/` lives next to this file. Resolve them
from the directory that contains this `SKILL.md`, never from the user's working
directory. In the commands below, `SKILL_DIR` means that directory, written out as
an absolute path.

- `node SKILL_DIR/scripts/scaffold.mjs plan <projectDir>`: detects the three anchors and the target, writes nothing.
- `node SKILL_DIR/scripts/scaffold.mjs scaffold <projectDir> [--confirm] [--no-install]`: scaffolds only what is missing, then installs dependencies. Exit `2` means the target is non-empty and needs the user's confirmation; re-run with `--confirm` after they approve.
- `node SKILL_DIR/scripts/scaffold.mjs add <appDir> --slug <slug> --title "<title>"`: copies `templates/presentation/` into `src/presentations/<slug>/` and registers it in `src/presentations/index.ts`.
- `templates/bootstrap/`: the app, kit, router, empty registry, and verify/inspect scripts. Used only by `scaffold`.
- `templates/presentation/`: per-presentation starter files. Used only by `add`.

Run npm commands in the app directory: `npm --prefix <appDir> run build`.

## The three anchors

The app is ready when all three exist. Detection is by contract, not by byte-identical files.

1. **Build setup**: `package.json` with a `build` script and a `vite` dependency, plus a Vite config.
2. **Scene kit**: `src/presentation-kit/` containing the step contract (`Step`, `Scene` in `types.ts`), the `Presentation` host, `Stage`, `usePresentationNav`, and `useFitScale`.
3. **Presentation index**: `src/presentations/index.ts` exporting `PRESENTATIONS`, the registry that maps each slug to its route.

## Procedure

### 1. Gather

Ask one question at a time. Cover, in order:

1. The topic and the audience's goal.
2. The visual direction: palette, type feel, mood, or a reference the user likes.
3. Each step: what it says (its title and browse caption), what is on screen, and which entities carry over from the step before.

Rules:

- Do not invent details the user can still give. If they skip one, use a sensible default and say which default you chose.
- The user may build with partial detail at any point. Accept it. Note the open items in your final summary.
- For a step whose layout is key or complex, you may draw a short ASCII mockup and ask the user to confirm it. Do not do this for every step.
- If the prompt already contains the topic, style, and all step details, skip the questions and build.

### 2. Resolve the target and scaffold what is missing

1. Run `plan <projectDir>` with the user's project root (the current project, or the directory they named).
2. Read the result:
   - `target` is `.` for a standalone project or an empty directory. Scaffold at the root.
   - `target` is `presentations` for a monorepo (`workspaces`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout). The app is self-contained under `presentations/`, and the monorepo root is not changed.
   - An app that already has all three anchors needs no scaffolding.
3. If `requiresConfirmation` is `true`, or the target is `presentations`, tell the user the exact target path, what is missing, and what will be written. Wait for their approval.
4. Run `scaffold <projectDir>` (add `--confirm` once approved). The helper copies only missing files, never overwrites existing ones, merges missing dependencies and scripts into `package.json`, and runs `npm install`.
5. Read `routing` in the result. `routed: false` means a host entry point the helper kept (it never overwrites) does not reach `src/RouteView.tsx` or the `PRESENTATIONS` registry, so presentations would build but not be reachable. Make the smallest edit to that entry (render `<RouteView pathname={window.location.pathname} />`, or route to the registry from the host's own router) and tell the user what you changed.
6. Confirm `npm --prefix <appDir> run build` passes before you continue. If it fails, fix it (see the repair loop in step 4).

Do not assume dependencies are installed. The helper installs them; check the output.

### 3. Create or modify a presentation

**Create** a new presentation:

1. Choose a slug (lowercase words joined by hyphens) and the title.
2. Run `add <appDir> --slug <slug> --title "<title>"`. This creates the folder and registers the route. Check `routing` in the output again; if `routed` is `false`, wire the host entry as described in section 2 before verifying. The starter contains `entities.ts`, `Scene.tsx`, `steps/index.ts`, `steps/01-first-step.tsx`, `Talk.tsx`, and `talk.css`.
3. Write the content:
   - `entities.ts`: one `ENTITY` id per entity that persists across steps. Ids are the layout identity, so an entity that appears in step 2 and stays until step 7 keeps the same id throughout.
   - `Scene.tsx`: a single scene component, `EvolvingScene`, whose `TalkPayload` carries `stage`. Each step is a number. The component draws everything that exists at that stage. Entities present from an earlier stage render unconditionally, so they morph in place. Newcomers are wrapped in `<Appear>`. Use the kit primitives `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, and `SceneLayer` for geometry. Coordinates are on the 880 x 380 design canvas.
   - `steps/NN-<kebab-title>.tsx`: one file per step. Each exports a `Step<TalkPayload>` with a unique `id`, the era, the `title` (short, for present mode), the `caption` (one browse-mode paragraph), `groupKey: 'evolving-scene'`, `scene: EvolvingScene`, and `payload: { stage: n }`. Steps that share a `groupKey` and scene share one mounted scene, so only the payload changes between them.
   - `steps/index.ts`: import every step and list them in talk order. Remove the starter step file if you do not use it.
   - `Talk.tsx`: already correct. It imports `talk.css` and renders `<Presentation initialMode="browse">`.
4. Style it in `talk.css`. Replace the starter palette and type with the look from step 1. Keep the chrome rules: the active table-of-contents entry and the active progress dot must read as distinct, and the attribution link must be legible. Every rule is scoped under `.<slug>`, so two presentations never collide.

Rules for every presentation:

- Use plain CSS in the presentation's own files. Do not add Tailwind or another framework unless the host project already uses it or the user asks for it.
- Never add colors, fonts, borders, or shadows to the scene kit or to the host `index.css`. Visual decisions belong to the presentation.
- Keep each entity's `id` unique within the presentation, and never wrap a continuing entity in `Appear`.
- Do not change or rename any `data-presentation-*` hook. The kit and the inspection tools depend on them.
- Style every class your scene uses in `talk.css`. An unstyled entity draws as bare text, and the visual check will flag it.

**Modify** an existing presentation:

1. If the user did not name the presentation, list the registered ones (`grep -n "slug:" src/presentations/index.ts` with their titles) and ask which one before changing anything.
2. Ask only about the requested change: a step, an entity, or the style.
3. Edit only that presentation's folder, plus its registry line if the title changes. Do not re-run the full create flow and do not touch other presentations.
4. Run the self-verify step below on the modified presentation.

### 4. Self-verify before you report done

Never report success on output that fails. Fix the failure, then re-run the check.

1. **Build**: `npm --prefix <appDir> run build`. Type errors fail the build.
2. **Render**: `npm --prefix <appDir> run verify`. It builds, starts a preview on `127.0.0.1`, and steps every registered presentation through every step, failing on console errors, page errors, or a step that does not advance.
3. **Visual composition**: `npm --prefix <appDir> run inspect -- <slug>`. It writes one settled screenshot per step to `.presentation-inspect/<slug>/` and prints advisory warnings.
   - Open the first step, the last step, and the densest or most important steps, using the Read tool on the PNGs.
   - For a responsive-sensitive presentation (dense diagrams, many entities), also run `npm --prefix <appDir> run inspect -- <slug> --narrow` and check the same steps.
   - Warnings name the step. Handle them this way:
     - `overlap`: move or resize the colliding elements. If the overlap is intentional and the text stays readable, wrap it in an element with `data-presentation-allow-overlap`.
     - `active-chrome`: give the active progress dot or contents entry a clearly different style in `talk.css`.
     - `attribution`: style `[data-presentation-attribution]` with a legible size, color, and underline.
     - `runtime`: fix the console or page error. It is a real failure.
   - Re-run `inspect` after each change until the warnings are gone or each remaining one is an intentional, marked overlap.
4. Finish with `npm --prefix <appDir> run verify` and confirm its last line starts with `PASS`.

For interactive checks you can also use `chrome-devtools-axi` against the preview. It does not replace `verify`.

### Repair loop

When a check fails:

1. Read the first error, not the summary.
2. Make the smallest fix in the presentation's own files. A build failure in the kit or host means the scaffold drifted; prefer fixing the presentation.
3. Re-run that check, then `verify`.
4. If the same check still fails after three attempts, stop and report the exact error and what you tried. Do not report success.

## Journeys this procedure supports

- **Empty standalone directory**: `plan` shows `target: "."` and all anchors missing. `scaffold` writes at the root and installs. Then create the presentation, verify, and report the route.
- **Partial monorepo**: `plan` shows `target: "presentations"`. State that path, get approval, then `scaffold --confirm`. The root is not modified. Create the presentation inside `presentations/`.
- **Add a presentation to a scaffolded app**: `plan` shows no missing anchors. Skip the scaffold and create. Existing presentations stay registered.
- **Modify without a target**: list the registered presentations, ask which, then make a scoped edit.
- **Failure repair**: run the checks in order and follow the repair loop.

## Keeping the templates in sync

`templates/bootstrap/` snapshots the repo's canonical kit and scripts. A parity test under `tests/unit/skill/` fails on drift. When you change the kit or the verify or inspect scripts, update the bootstrap copy too. See `README.md` in this directory.

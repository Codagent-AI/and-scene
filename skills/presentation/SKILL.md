---
name: presentation
description: Create or modify a scene-based, step-by-step presentation as a self-contained app route. Scaffolds the Vite + React + TypeScript build, the scene kit, and the presentation registry when they are missing, then verifies the build and the rendered steps in a browser.
---

# Presentation

This procedure creates or modifies a presentation. Choose the branch first. To create a presentation, follow sections 1 to 5. To modify an existing one, go to section 6 and skip section 1. Both branches end with the self-verification in section 7.

## Paths

- The skill directory is the directory that contains this file. Write its absolute path down once and use that path for every command below. Do not resolve paths against the current working directory.
- The helper is `<skill-dir>/scripts/scaffold.mjs`. It locates its templates from its own file location, so it works from any working directory.
- The bootstrap template is `<skill-dir>/templates/bootstrap/`. Copy from there only through the helper.

## 1. Gather the presentation (create only)

- Use this section only when the request creates a new presentation. A request to change an existing presentation goes straight to section 6, and you do not ask the creation questions.
- Ask one question at a time. Cover the topic first, then the visual style, then each step's content and visual description, in step order.
- Ask only for details the prompt does not already contain. If the prompt already gives the topic, the style, and every step, skip the questions and go to section 2.
- Never invent details the user can still provide. If the user chooses to build with partial detail, build from what was captured, fill only the gaps needed to build, list those gaps in your final report, and offer to iterate.
- Do not block on completeness. The user controls how much detail to give and can iterate later.
- You may draw an ASCII mockup of a key or complex step to confirm its layout with the user. Do this only for steps whose layout matters, not for every step.

## 2. Check the project's anchors

The presentation depends on three contract anchors. A project has an anchor when it satisfies the contract below. File names, formatting, and extra dependencies do not matter.

1. Build setup: a Vite + React + TypeScript app whose `package.json` declares `react`, `react-dom`, `vite`, and `typescript` (in `dependencies` or `devDependencies`), has a `build` script, and has a `vite.config.*` file.
2. Scene kit: files under `src/presentation-kit/` that together export `Presentation`, `usePresentationNav`, `useFitScale`, and a `Step` type.
3. Presentation index: `src/presentations/index.ts` that exports `PRESENTATIONS` and contains a `slug` field and a `load` field for each entry.

Run the helper from any directory, using the project path:

`node <skill-dir>/scripts/scaffold.mjs <project-dir>`

It prints JSON with a `target` object (`appDir`, `relation`, `signals`, `anchors`, `nonEmpty`, `needsConfirmation`, `reason`) and a `plan` object (`missingAnchors` and the files it would create or merge). It writes nothing without `--apply`.

Then choose one of three branches:

- No anchors present in the target: full scaffold. Scaffold everything, install the dependencies (section 4), and only then create the presentation.
- All three anchors present: skip scaffolding and go directly to section 5 or 6.
- Some anchors present: scaffold only the missing anchors. Never modify or replace the anchors that are already present.

The helper never overwrites an existing file. It merges `package.json` only by adding dependency, devDependency, and script keys that are missing, and it keeps every existing value.

## 3. Choose the target location

- If `target.relation` is `root`, the target is the project root.
- If `target.relation` is `presentations`, the target is `presentations/` inside the project, as a self-contained app.
- The helper uses this order. Anchors all present at the project root: use the root. A monorepo signal exists and `presentations/` already has anchors: reuse that app and scaffold only its missing anchors. A monorepo signal exists and there is no app yet: scaffold a self-contained app in `presentations/`. Otherwise: scaffold at the root.
- A monorepo signal is any one of: a `workspaces` field in the root `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/` directory.
- Tell the user which signal was used, or that the project is standalone, using the helper's `reason` field. Do not scaffold into a monorepo root.
- If `target.needsConfirmation` is `true`, the project is not empty and at least one anchor is missing at the target. State the exact target directory, list what will be scaffolded, and wait for the user to confirm before any write or install. Do not run `--apply` before that confirmation.
- If `target.needsConfirmation` is `false`, you may proceed. This is the case for an empty directory and for a target that already has all anchors.

## 4. Scaffold and install

1. Run `node <skill-dir>/scripts/scaffold.mjs <project-dir> --apply` only after any required confirmation. The helper writes the planned files and reports the paths it wrote or merged.
2. Change into `target.appDir` and run `npm install`. Run it after every scaffold, even if `node_modules` already exists, because the merged dependencies may be new. Do not assume the dependencies are installed.
3. Run `npm run build` in `target.appDir`. Fix any error before continuing.
4. If the host already had a build setup, the helper merges the bootstrap `package.json` into it: every missing dependency (for example `motion` and `lucide-react`), devDependency, and script (`verify`, `inspect`) is added, and every existing value is kept. Check that the merged file declares `react`, `react-dom`, `motion`, `lucide-react`, `vite`, `typescript`, `playwright`, and the `verify` and `inspect` scripts before you run `npm install`. If a required entry is missing, add it to `package.json` yourself and keep the existing values. If the host has no `"type": "module"` field and the scaffolded config files need it, ask the user before changing it, because it affects the host's other files.
5. The scaffold ships no styling framework and no default colors, fonts, spacing, cards, or buttons. Keep it that way. Styling goes only in presentation-owned or host-owned files.

## 5. Create a presentation

- Choose a kebab-case slug from the topic. If `src/presentations/<slug>/` already exists, choose another slug or ask the user.
- Start from the templates in `<skill-dir>/templates/presentation/` (`entities.ts`, `steps.ts`, `Talk.tsx`, `presentation.css`). Copy them into `src/presentations/<slug>/` and replace every `__SLUG__` and `__TITLE__` placeholder.
- Create a self-contained folder `src/presentations/<slug>/` containing:
  - `entities.ts` for the presentation's stable entity identities and layout ids.
  - A steps module, one `Step` object per step, composed from the kit's exports.
  - `Talk.tsx`, which renders `<Presentation steps={...} title="..." />` for the presentation's steps.
  - A presentation-owned plain CSS file, imported by `Talk.tsx`. Plain CSS is the default styling approach. Use Tailwind or another framework only if the host project already uses it or the user explicitly asks for it.
- Use `src/presentations/how-to-make-a-presentation/` as the structural reference. It is the bundled sample that the scaffold ships.
- Every step needs a caption and must work with next and previous navigation. Each step adds or moves entities, so persisting entities keep their layout ids across steps.
- Style the active table-of-contents entry, the progress indicator, the navigation controls, and the attribution in the presentation's CSS. The active step must be visibly distinct from the inactive ones, and the attribution must be legible.
- Do not put colors, fonts, borders, shadows, or theme tokens into any file under `src/presentation-kit/`.
- Register the presentation by appending one entry to the `PRESENTATIONS` array in `src/presentations/index.ts`, with `slug`, `title`, and `load: () => import('./<slug>/Talk')`. Append only. Do not reorder, rewrite, or remove existing entries.
- Do not modify any other presentation's files while creating a new one.

## 6. Modify an existing presentation

- If the request does not name a clear target, list the existing presentations from `src/presentations/index.ts` (slug and title) and ask which one to change. Do not edit anything until the user picks one.
- Once the target is identified, ask only about the changes the user requested: steps, entities, or style. Do not repeat the full creation interview.
- Edit only that presentation's folder, plus its registry entry if its title changes. Keep its slug unless the user asks to rename it. Leave other presentations unchanged.
- Run the self-verification in section 7 after the edit.

## 7. Self-verify before reporting completion

Do not report success until every check below passes. When a check fails, fix the cause in the presentation or the host, then re-run that check and the checks after it.

1. Build: run `npm run build` in `target.appDir`. It must finish with no type errors.
2. Project checks: run `npm run verify` in `target.appDir`. It builds the app, checks the registry and the bundled sample, and renders and steps through the sample in a browser. It prints `PASS`, or `FAIL <phase>` with a step index for render and transition failures. Any failure must be fixed and re-run.
3. Visual composition: run `npm run inspect -- <slug>`. It writes settled screenshots to `.inspection/<slug>/step-NN.png` (two digits, starting at 1). Any console or page error reported for the first step counts as a failure of the first-step render check.
4. View the screenshots of the first step, the last step, and every dense or key step. Check that the content fits the fixed canvas, that intentional overlaps stay readable, and that no content collides with captions, the progress indicator, the table of contents, or the navigation controls.
5. Responsive check: if the presentation is responsive-sensitive (wrapping text, many entities, or dense steps), also inspect at a narrow viewport of 390 px wide, using the helper's narrow-viewport option shown in `npm run inspect -- --help`.
6. Review advisory warnings: the inspection output lists overlap and chrome-polish warnings by step. Warnings do not fail the run, but you must review every warning that cites a step. Then:
   - Fix accidental collisions by moving, resizing, or reflowing the content.
   - Fix active chrome that is not visibly distinct from the inactive chrome, and attribution that is too small or still browser-default, by changing the presentation's CSS.
   - Mark an overlap only when it is intentional and readable, by adding the attribute `data-presentation-allow-overlap` to the element that contains the overlap.
   - Re-run `npm run build`, `npm run verify`, and `npm run inspect -- <slug>` after any change.
7. Optional interactive check: if `chrome-devtools-axi` is available, you may open the dev server at `http://127.0.0.1:<port>/<slug>` to check navigation by hand. This does not replace the scripted checks above.

If the screenshot helper is missing from the project, which can happen only if the host project lacks the verification files, do not run a helper from outside the project. Instead:

1. Install `playwright` as a dev dependency in `target.appDir` if it is not already declared there.
2. Write a temporary Playwright script under the project root, for example `<app>/.inspection/capture.mjs`, so that the project's own dependencies resolve.
3. Use `http://127.0.0.1` URLs. Wait for animations to finish before each capture. Save the captures to `.inspection/<slug>/`.
4. Delete the temporary script when you finish.

Never commit the `.inspection/` directory, screenshots, `node_modules`, or build output.

## 8. Report

When every check passes, report the target location, the presentation slug and route, the steps you created or changed, the screenshots you reviewed, and any gap you filled with a default. Do not mention internal test identifiers. Do not claim success for any check you did not run.

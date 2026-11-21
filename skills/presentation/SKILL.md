---
name: presentation
description: Create or modify a browser presentation whose diagram evolves through named steps. Use for visual explanations, technical walkthroughs, and changes to existing And Scene presentations.
---

# Presentation

A presentation is one scene that evolves through named steps. Use stable entity IDs across steps, and give each step a stable ID, an era, a short presenter title, a browse caption, and a diagram state.

## Gather the requested details

For a new presentation, gather the topic, visual style, and the content and visual description of each step. Reuse anything the user already supplied. Ask one question at a time for missing details and give the user the choice to build from what they have provided. Wait for that choice before filling details they can still provide. If they ask to proceed, make only the working choices needed to build and leave room to iterate. For a key or complex step, an ASCII mockup can clarify the proposed layout before building. A complete prompt is enough to begin.

For a modification, inspect the registry first. If the target is ambiguous or absent, list the existing presentations and ask which to modify before making changes. Once the target is clear, ask only about details of the requested edit. Keep other presentations, registry entries, and unrelated host files intact.

## Resolve and prepare the app

Resolve templates relative to this skill's own `SKILL.md`, wherever the skill is installed. With the absolute skill directory, use `node /absolute/path/to/skill/template-path.mjs bootstrap` to find the bootstrap snapshot, or pass `presentation` for files to copy into a new presentation. The user's working directory can be anywhere.

If already inside a presentation app, use it. Otherwise, look for a `workspaces` field in an ancestor repository's `package.json`, a `pnpm-workspace.yaml`, or an `apps/` or `packages/` workspace layout. In a monorepo use a self-contained app at its `presentations/` directory. In an empty directory or standalone repository use its root.

Inspect the resolved app for the three capabilities below.

- A Vite, React, and TypeScript build that exposes a working `npm run build`.
- A reusable scene kit with a step and scene contract, motion stage, fit scaling, navigation, and browse/present chrome.
- An explicit presentation registry that maps entries to reachable routes.

Recognize capabilities even when names, file layouts, or formatting differ. If all anchors exist, use them as they are. If any are missing in a non-empty project, state the exact destination and what infrastructure would be added, then wait for confirmation before writing.

When no anchors exist, use `templates/bootstrap/` to supply them. In a partial scaffold, copy or adapt only the missing infrastructure and merge the necessary entry-point and package-script wiring with existing files. Keep existing anchors and unrelated files intact, including monorepo root configuration. Supply the bundled verification and inspection helpers when scaffolding an app that lacks those checks. The bootstrap includes a neutral example route named `starter`. A partial scaffold can register the first real presentation directly. Update the app's default verification target if you remove the starter.

When scaffolding, install the required packages in the resolved app before creating or modifying the presentation. For a complete copy of the bootstrap, run `npm ci` using its lockfile. In a monorepo, run installation against the self-contained target, keeping the root manifest and lockfile intact. For a merged scaffold, add the missing dependencies using the app's package manager and update its lockfile. Ensure React, React DOM, Motion, Lucide, Vite and its React plugin, TypeScript and the React/React DOM/Node types, the ESLint stack, and Playwright are all present. Use `npx playwright install chromium` when Chromium is missing. The bootstrap and kit need no CSS framework, colors, fonts, spacing scale, card or button styles, borders, shadows, or theme tokens.

## Create or edit the scene

For a new presentation, choose a unique URL-safe slug and copy the presentation template to `src/presentations/<slug>/` (or the equivalent directory). Customize `Talk.tsx`, the presentation's entity namespace, and the ordered steps. Add one lazy registry entry that points to the new `Talk.tsx`. Keep every existing route reachable.

Use the kit's fixed design canvas and compose the steps with kit primitives or raw Motion elements with stable `layoutId` values. Give adjacent beats that share a scene component the same group key and pass typed payloads to update the scene in place. Keep continuing identities and intentional placements. Sequence newcomers after continuing motion, and give departing entities an exit. Captions and both navigation directions should work across the presentation.

Use presentation-owned or host-owned plain CSS by default. Follow an existing host framework or an explicitly requested framework where appropriate. Put visual treatments in local styles, and use the stable chrome hooks to give the current navigation state a visible treatment and make attribution legible.

## Verify the actual result

From the resolved project root build the whole app and render the affected route. With the included scripts, `node scripts/verify.mjs <slug>` builds and checks every step on a production preview on `127.0.0.1`. If the host has a different verifier, run its build and at least a production-preview check of the new or modified route's first step without runtime or console errors. A passing check of an unrelated sample is insufficient.

Prefer the project's own screenshot helper, `npm run inspect -- <slug>`, for settled captures. For responsive-sensitive scenes, also run it with a narrow viewport, for example `--width 390 --height 844`. When no local helper exists, place any temporary Playwright script under the project root so local dependencies resolve, and remove the temporary script afterward.

Review the first, last, and any dense or key steps in screenshots or an equivalent browser view. Confirm important content fits the fixed canvas, captions and controls remain clear of the scene, and active navigation and attribution are legible. Review warnings at the indicated steps. Fix accidental collisions and indistinct chrome, and add `data-presentation-allow-overlap` only to subtrees whose intentional overlap remains readable. Keep these style corrections with the presentation or host.

Fix build, runtime, or composition problems and repeat the relevant checks before reporting success. Report the route and checks that passed, and accurately describe any remaining advisory warnings.

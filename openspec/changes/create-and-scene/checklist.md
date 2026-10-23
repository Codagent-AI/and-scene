# Checklist: create-and-scene

Specs: `specs/evolving-scene-presentations/spec.md` (ESP), `specs/presentation-skill/spec.md` (PS), `specs/presentation-verification/spec.md` (PV).

| ID | Behavior | Spec reference | How to verify |
|---|---|---|---|
| I-1 | A step carries a stable id, section/era label, presenter title, browse caption, and diagram state | ESP, "Scene step model" / Step carries narration and identity | Type-level and unit test of the `Step` contract (`types.ts`) and a sample step |
| I-2 | On-screen step numbers derive from position; insert/remove/reorder needs no renumbering | ESP, "Order-derived numbering" | Vitest component test rendering reordered step arrays and checking displayed numbers |
| I-3 | A grouped scene with a typed payload is accepted by `<Presentation>` with no casts | ESP, "Typed payloads reach presentation boundary" | Type-check fixture (`tsc` via `npm run build`) with a typed-payload grouped scene and no `as` casts |
| I-4 | A persisting entity keeps its `layoutId` across consecutive steps and morphs in place | ESP, "Persisting entity morphs" | Unit/component test that the same `layoutId` is rendered in both steps; inspect the sample's `entities.ts` namespace |
| I-5 | A new entity enters only after persisting entities settle (`Appear` delay sequencing) | ESP, "New entity enters after others settle" | Unit test of `Appear` timing props against `LAYOUT_T`/`ENTER_DELAY` constants |
| I-6 | An entity absent from the next step animates out (presence exit) | ESP, "Departing entity exits" | Component test that a removed entity is wrapped with exit behavior inside `AnimatePresence` |
| I-7 | Adjacent steps with the same group key and scene component update in place without remount | ESP, "Grouped steps update in place" | Component test counting mount/unmount of the scene across grouped navigation |
| I-8 | Continuing entities in grouped steps are not wrapped in newcomer fade-in | ESP, "Continuing entities are not faded as newcomers" | Component test that a continuing entity has no `Appear` initial/fade state when a step changes |
| I-9 | Intentional overlap or stacking in a grouped scene is preserved | ESP, "Intentional composition is preserved" | Inspection of the sample steps and node primitives for forced spreading; `allow-overlap` marker unit test |
| I-10 | The kit supplies no colors, fonts, borders, shadows, card or button styling, or theme tokens | ESP, "Style ownership boundary" / Unstyled kit output | Scripted scan of `src/presentation-kit/**` for style declarations (no CSS files or inline color/font/border/shadow); unit contract test; INT-001 |
| I-11 | Kit primitives and chrome expose stable `data-presentation-*` hooks and class/style props | ESP, "Kit primitives expose style hooks" and "Coordinate-heavy diagrams are supported" | Vitest contract test over each primitive and chrome component asserting hooks and class/style passthrough |
| I-12 | The kit has no Tailwind or other styling-framework dependency | ESP, "Optional styling frameworks remain optional" | Scripted check of `package.json` and the template `package.json`, and a grep of kit imports; INT-001 |
| I-13 | The default attribution reads "made by and-scene", sits bottom-right, links to the and-scene GitHub repo, and exposes a stable hook | ESP, "Kit attribution" / Default attribution; Attribution exposes a styling hook | Vitest component test of the rendered link text, href, and hook |
| I-14 | There is no default top-left and-scene brand; the header slot is empty without host branding | ESP, "Top-left brand is opt-in" | Component test of the header without a brand prop |
| I-15 | Present mode shows the marker and one-line title and hides the caption, TOC, and prev/next | ESP, "Present mode is title-focused" | Vitest component test in present mode |
| I-16 | Browse mode shows title, caption, TOC on wide viewports, prev/next, and progress indicators | ESP, "Browse mode is reading-focused" | Vitest component test in browse mode with a mocked wide viewport |
| I-17 | Toggling the mode preserves the current step, and a presentation may declare `initialMode` | ESP, "Mode toggle preserves position"; "Present and browse modes" | Unit test of `usePresentationNav` and a `Presentation` component test |
| I-18 | Right, Space, and PageDown advance; Left and PageUp go back | ESP, "Keyboard navigation" | Unit test of `usePresentationNav` key handling |
| I-19 | A horizontal swipe left advances and a swipe right goes back | ESP, "Touch swipe" | Unit test of `usePresentationNav` with synthetic touch events |
| I-20 | Clicking a progress indicator jumps to that step, and a TOC entry jumps to its era's first step | ESP, "Direct jump" | Component test of the click handlers and resulting `data-step-index` |
| I-21 | The active progress indicator and TOC entry expose `aria-current` and a stable active hook | ESP, "Active navigation state is exposed" | Component test asserting the attributes on the active item and their absence on others |
| I-22 | Navigation keys on a focused interactive control drive that control and do not advance the deck | ESP, "Controls keep their keys" | Unit test dispatching key events with focus on a button or input |
| I-23 | Navigation clamps at the first and last step with no wrap | ESP, "Boundary behavior" / Clamp at start; Clamp at end | Unit test of `next`/`prev` at index 0 and last |
| I-24 | The default canvas is 880 × 380 with per-mode fit geometry | ESP, "Fixed-canvas fit scaling" / Default canvas dimensions | Unit test of `DESIGN_W`, `DESIGN_H`, and `STAGE_LAYOUT.{browse,present}` constants |
| I-25 | The diagram scales uniformly on resize without reflowing its composition | ESP, "Uniform scaling on resize" | Unit test of `useFitScale` (uniform scale, `MIN_SCALE` floor); inspection that the canvas is a fixed-size scaled element |
| I-26 | The skill asks for the topic, style, and per-step details one question at a time and does not assume details the user can still give | PS, "Interactive requirement gathering" / Prompt is missing details | Inspection of `skills/presentation/SKILL.md` procedure text |
| I-27 | The skill proceeds with partial detail and with a complete prompt, and may offer ASCII mockups for key steps | PS, "User proceeds with partial detail"; "Prompt already complete"; "ASCII mockup for a complex step" | Inspection of `SKILL.md` |
| I-28 | The skill detects the three anchors (build setup, scene kit, presentation index) at contract level, not by byte-identical match | PS, "Self-bootstrapping scaffold" | Inspection of `SKILL.md` and any detection script; unit test of the detection logic if a script exists |
| I-29 | An empty or unscaffolded directory gets a full scaffold and a dependency install before the presentation | PS, "Empty or fully unscaffolded directory" | INT-001 (materialized bootstrap) plus inspection of `SKILL.md` ordering |
| I-30 | An already scaffolded project skips scaffolding | PS, "Already scaffolded" | Inspection of `SKILL.md`; unit test of detection returning "none missing" |
| I-31 | A partial scaffold adds only the missing anchors and leaves present ones untouched | PS, "Partial scaffold" | Inspection of `SKILL.md`; unit test of the missing-anchor computation if scripted |
| I-32 | The scaffold builds without Tailwind and defines no default colors, fonts, spacing scale, card or button styles, borders, shadows, or theme tokens | PS, "Scaffold does not impose a style system" | INT-001 (build plus a style-default scan of the materialized app) |
| I-33 | The scaffold installs the full dependency set (React, Vite, TypeScript and types, Motion, Lucide, eslint stack, Playwright) and does not assume any are present | PS, "Self-bootstrapping scaffold" | INT-001 (assert the template `package.json` and lockfile declarations) |
| I-34 | Template paths resolve relative to the skill's own `SKILL.md`, independent of the working directory | PS, "Templates resolve from skill directory" | INT-001 (materialize from a different working directory); inspection of `SKILL.md` |
| I-35 | A monorepo target scaffolds a self-contained app under `presentations/`, and the detection signals are documented | PS, "Monorepo target"; design, "Scaffold target resolution" | Inspection of `SKILL.md`; unit test of the target-resolution logic if scripted |
| I-36 | A standalone or empty project scaffolds at the repository root | PS, "Standalone project target" | Inspection of `SKILL.md`; unit test of target resolution if scripted |
| I-37 | In a non-empty project missing scaffolding, the skill states the target and proceeds only after the user confirms | PS, "Non-empty project missing scaffolding" | Inspection of `SKILL.md` |
| I-38 | A new presentation is its own folder with its own route, registered in the index | PS, "New presentation is self-contained and routed" | Registry unit test and routing unit test; inspection of the presentation template |
| I-39 | Presentation styling lives in presentation-owned or host files, with plain CSS as the default | PS, "Presentation owns its visual style" | Inspection of `SKILL.md` and templates; the style scan from I-10 confirms the kit stays clean |
| I-40 | Creating a presentation leaves existing presentations intact and reachable | PS, "Existing presentations are preserved" | Registry test that adding an entry keeps the existing entries and routes; inspection of `SKILL.md` |
| I-41 | Modifying an unspecified or ambiguous target lists the presentations and asks first; a scoped modification asks only about the requested changes | PS, "Modify an existing presentation" | Inspection of `SKILL.md` |
| I-42 | Before reporting success, the skill builds, runs a first-step render check, and runs a browser visual check on the first, last, and dense steps (narrow viewport when responsive-sensitive), fixing failures and re-checking | PS, "Self-verify before reporting completion"; "Failures are fixed, not reported as success" | Inspection of `SKILL.md` |
| I-43 | The skill prefers the project-local screenshot helper, and otherwise writes any temporary Playwright helper under the project root | PS, "Screenshot helper is project-local" | Inspection of `SKILL.md` |
| I-44 | The skill reviews the helper's warnings, fixes accidental ones, and marks only intentional readable overlaps as allowed | PS, "Visual warnings are reviewed" | Inspection of `SKILL.md` |
| I-45 | A generated presentation builds with no type errors | PS, "Builds clean"; PV, "Build verification" | `npm run build` exit code; E2E-001 |
| I-46 | A generated presentation renders its first step with no runtime or console errors | PS, "Renders without errors" | E2E-001 |
| I-47 | Every step has a caption, and next/previous navigation is present | PS, "Captions and navigation present" | Registry/sample contract test over the step data plus the I-16 component test |
| I-48 | Visual composition is inspected: content fits the canvas and does not collide with chrome | PS, "Visual composition is inspected" | Inspection of `SKILL.md` and the screenshot-helper warnings (INT-002) |
| I-49 | Presentation-owned CSS makes the active TOC, progress, and nav chrome distinct and the attribution legible, while the kit stays free of defaults | PS, "Active chrome and attribution are styled locally" | Inspection of the sample's CSS and the kit style scan from I-10; INT-002 shows no indistinct-chrome or attribution warnings for the sample |
| I-50 | Verification fails when `npm run build` reports a type or build error | PV, "Build must succeed" | E2E-002 (build-breaking copy exits non-zero and names the build phase) |
| I-51 | The committed sample "How to Use This Skill to Make a Presentation" is registered and reachable | PV, "Committed reference sample" | Registry unit test; E2E-001 |
| I-52 | The sample implements the nine steps with the normative era, title, and caption, in order | PV, "Sample exists and matches the outline" | Unit/contract test comparing the registry steps to the spec table; E2E-001 |
| I-53 | The sample scene content follows the spec: entities accumulate and are not rearranged, and the final frame is the self-reference reveal | PV, nine-step table (scene content column) | Inspection of the sample `entities.ts` and `steps/*` against the table |
| I-54 | A missing or malformed sample fails verification | PV, "Missing sample fails" | E2E-002 (missing or out-of-order sample copy exits non-zero) |
| I-55 | Verification renders every step in a real browser and passes when none errors | PV, "Every step renders cleanly" | E2E-001 (`npm run verify`) |
| I-56 | The preview host, readiness probe, and browser URLs all use `127.0.0.1` | PV, "Preview uses IPv4 loopback" | Grep of `scripts/verify.mjs` and `scripts/inspect-presentation.mjs` for `localhost`; E2E-001 |
| I-57 | A console error or uncaught page error fails verification and names the failing step | PV, "Console or page error fails verification" | E2E-002 (a browser-error copy) |
| I-58 | A step that fails to advance or errors fails verification and names the step | PV, "Step error fails verification" | E2E-002 (a non-advancing transition copy) |
| I-59 | Verification exits non-zero on failure, names the failed check, prints a clear pass on success, and cleans up preview subprocesses | PV, "Pass/fail reporting" | E2E-001 and E2E-002 (exit codes, output, no leftover preview processes) |
| I-60 | The chrome exposes `data-step-count` and `data-step-index` hooks | Design, "Verification" | Vitest component test of the chrome hooks; E2E-001 |
| I-61 | The screenshot helper captures one screenshot per step at a desktop viewport under a predictable project-local directory | PV, "Capture step screenshots" | INT-002 |
| I-62 | The helper waits for the settle interval before each screenshot | PV, "Screenshots are settled" | INT-002 |
| I-63 | The helper warns on unmarked text/chrome overlap, naming the step and elements | PV, "Suspicious overlap is reported" | INT-002 |
| I-64 | An allow-overlap marker suppresses warnings inside its subtree | PV, "Intentional overlap can be marked" | INT-002 |
| I-65 | The helper warns when the active chrome is indistinct | PV, "Indistinct active chrome is reported" | INT-002 |
| I-66 | The helper warns on small or browser-default attribution and points to the styling hook | PV, "Unpolished attribution is reported" | INT-002 |
| I-67 | The bootstrap template is complete, builds and passes its route smoke check from outside the source repo, and its kit stays byte-aligned with `src/presentation-kit/` | CLAUDE.md change guidelines; test plan | INT-001 (kit parity comparison) |
| I-68 | The root verify and inspect scripts stay aligned with their bootstrap-template copies | CLAUDE.md change guidelines | INT-001 parity comparison of `scripts/` against the template copies |
| I-69 | `npm test` runs only fast unit and contract tests, and the browser-backed suites use a separate npm script | CLAUDE.md, "Implementation Workflow" | Inspection of `package.json` scripts; `npm test` run |
| I-70 | Lint passes over the repository | CLAUDE.md, "Implementation Workflow" | `npm run lint` exit code |
| I-71 | The main router shows the landing page at `/`, lazy-loads `/<slug>`, and falls back to landing for an unknown slug | Design, "Routing + registry" | Vitest router unit test |
| I-72 | The landing page lists every registry entry with a link | Design, "Routing + registry" | Vitest component test |
| I-73 | No generated output, dependency directories, screenshots, or CI configuration are committed | CLAUDE.md, "Change Guidelines" | `git status` and `git ls-files` check plus `.gitignore` inspection |

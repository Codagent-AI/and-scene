## D-01: Implementation — automated verification and static inspection

Question: How should manual visual checks and checklist inspections be handled under the automated-only instruction?
Requirement: The approved skill must require browser composition review, while this implementation session must not operate the product, inspect screenshots, or run acceptance tests. The workflow prohibits tests of prompt wording.
Decision: Ship the full composition-review procedure in the skill and automated screenshot diagnostics, but do not perform interactive or screenshot review in this session. Inspect source files for the checklist's documentation-only rows and save explicit inspection notes; test executable behavior with automated tests only.
Alternatives: Interactive review would violate the latest instruction; asserting prompt strings would violate the workflow; dropping the skill's review requirement would change the approved definition.
Rationale: This preserves the shipped requirement while respecting the implementation/acceptance boundary. Static source inspection is prescribed for documentation and does not operate the product.
What breaks if wrong: Static notes establish procedure coverage, not real agent compliance or subjective visual coherence; independent acceptance must establish those.
Pending user decision: None; no exception to the shipped requirement is proposed.
Evidence: `workflow-context.txt` records the controlling workflow and repository context.

## D-02: Implementation — distributable example and generic verification

Question: What should a fresh style-neutral bootstrap verify before the author's presentation exists?
Requirement: INT-001 requires a registered route smoke check in the materialized app; the repository verifier must enforce the canonical nine-step reference, and root/template scripts must match.
Decision: Bootstrap includes an unstyled two-step `example` presentation and sets its npm verify script to `node scripts/verify.mjs --slug example`. The identical verifier defaults to canonical-reference validation in the repository and supports explicit registered slugs for generated work. Browser traversal switches initial present mode to browse so titles/captions can be checked.
Alternatives: Copying the designed reference into the bootstrap would make the bootstrap less minimal; rejecting every non-reference route would prevent skill self-verification of new work; skipping reference validation globally would violate the approved requirement.
Rationale: A small unstyled example demonstrates all three contracts while keeping the reusable scaffold free of visual defaults. Explicit routes preserve whole-app builds and error checks for all new presentations.
What breaks if wrong: Generic slugs intentionally do not enforce reference metadata; the default canonical command still does. The helper captures browse-mode artifacts rather than initial live-delivery mode.
Pending user decision: None.
Evidence: `I-14-types.log` establishes the public typed boundary; forthcoming `INT-001-verify.log` and `E2E-001.log` establish materialized and canonical verification.

## D-03: Implementation — linting nested distributable scaffolds

Question: How should lint distinguish the repository and its nested bootstrap TS configuration?
Requirement: Root and materialized apps must provide working lint/build tooling, and distributable code must remain usable outside the source repository.
Decision: Set ESLint's TypeScript parser root explicitly from each configuration's own import.meta.dirname and continue linting the template source. Separate route lookup from the component module and presentation-template scene components from step data; cache lazy React elements at module scope. Exempt only test fixtures from the React Refresh export rule. Extend INT-001 to run the materialized app's lint command as well as build/render.
Alternatives: Ignoring all template files would conceal release defects; disabling the React rules globally would conceal component lifecycle mistakes; hardcoded repository paths would break the distribution.
Rationale: Both configurations remain location-independent and normal authored modules follow the React export/lifecycle contracts. The browser route behavior is unchanged.
What breaks if wrong: A materialized template could fail lint or lazy-route navigation; INT-001 and the affected route/browser checks catch those regressions.
Pending user decision: None.
Evidence: `lint-first.log` captures ambiguous roots; `lint.log` captures the repaired root lint check; `INT-001-lint.log` captures materialized lint once rerun completes.

## D-04: Audit — reference sample step 3 morph link

Question: Does step 3 of the reference sample need the "what morphs" link drawn in step 3 itself, or may it first appear at step 4 when the second card lands?
Requirement: specs/presentation-verification/spec.md, "Committed reference sample", row 3 (scene content: first step-card lands in the tray; what morphs is drawn on the link between consecutive cards, not inside them) and row 4 (more step-cards land).
Decision: Treat the link as part of step 3's scene content, so the implementation (links only at beat >= 4, `src/presentations/how-to-make-a-presentation/steps/Scene.tsx`) is reported as a finding. The row 3 caption ("plus what morphs from one step into the next") and scene intent both name the link at step 3; row 4 only adds more cards.
Alternatives: Accept links first appearing at step 4 (the implementor's reading, with I-29 test `expected[2]=['tray','card1']`); this leaves step 3 with no visual for the caption's claim.
Rationale: The scene-intent column is normative; row 4 does not mention links, so row 3 is the only place the spec puts them.
What breaks if wrong: Adding an outgoing link stub at step 3 would be a small extra entity if the spec meant step 4; low cost.
Pending user decision: None.

## D-05: Audit — sample-validation failure phase

Question: Should a title/caption/order mismatch in the reference sample be reported under a sample phase or the render phase?
Requirement: specs/presentation-verification/spec.md, "Pass/fail reporting" (identify which check failed); design.md Verification step 2 (sample assertion is its own check); checklist I-31 claims "sample-phase failure".
Decision: Report as a finding: `FAIL [render]: render: step 0: sample: outline mismatch` mislabels the failed check.
Alternatives: Accept render label because validation runs inside the browser traversal.
Rationale: Design separates the sample assertion from the render check, and the checklist row itself claims a sample-phase failure.
What breaks if wrong: Only diagnostics wording; no behavioral change.
Pending user decision: None.

## D-06: Resolve findings — step 3 outgoing morph link

Step: Resolve finding 1, I-29.
Question: How can the normative link appear in step 3 while only the first card has landed?
Requirement: Reference outline step 3 names the morph link; step 4 adds the other cards and retains existing entities.
Decision: Introduce the first outgoing morph link in step 3 at its final inter-card coordinates. It points toward the next card's future slot and persists unchanged when that card lands in step 4. Do not move cards earlier or add a placeholder card.
Alternatives: Delay the link until step 4 (the audited defect), or introduce a second card in step 3 (changes the normative accumulation sequence).
Rationale: The link represents what changes next while preserving the specified first-card/remaining-cards ordering.
What breaks if wrong: A link could be interpreted as requiring an already visible target card; the step-3-only-first-card requirement would then conflict with that interpretation. No approved requirement is waived.
Pending user decision: None.
Evidence: `resolve-source-context.txt`; `resolve-unit-development.log` records the revised I-29 case.

## D-07: Resolve findings — mode changes discard layout snapshots

Step: Resolve finding 2, I-21.
Question: How should mode geometry change without triggering entity projection or losing grouped component state?
Requirement: Design says mode switching is a re-render, not a morph; current step and grouped scene persistence must remain intact.
Decision: Call Motion's public useInstantLayoutTransition operation immediately before the mode state update, for both the keyboard and button paths. Call the state update separately so the mode remains usable even before a projection root exists.
Alternatives: Remount the scene (loses persistent state), suppress all subsequent animation (breaks step morphs), or leave mode updates unguarded.
Rationale: Discarding projection snapshots for the switch commit snaps geometry while preserving the instance and normal later transitions.
What breaks if wrong: Mode-only projection would still animate or subsequent steps would stop animating. A real-Motion component test asserts no layout starts for both mode changes and positive starts for normal step changes before and after.
Pending user decision: None.
Evidence: `resolve-motion-development.log`; `resolve-source-context.txt`.

## D-08: Resolve findings — classify observed sample defects and prove registration

Step: Resolve finding 3, I-31.
Question: How should browser-discovered metadata defects and source mentions of an unregistered slug be handled?
Requirement: Verification identifies the failed check and proves the reference is registered/reachable, with normative metadata in order.
Decision: Preserve a typed SampleValidationError through browser error causes and classify it as the sample phase. Check the rendered landing registry for an exact route link instead of searching TypeScript source text; traversal then proves that route's actual scene and metadata.
Alternatives: Classify every browser-discovered failure as render, or parse source strings/AST without proving built registration.
Rationale: Error phase follows the violated contract rather than where it was observed; runtime registration avoids false positives from comments or unused declarations.
What breaks if wrong: Metadata or comment-only registration faults could pass or be mislabelled. Controlled missing, comment-only unregistered, reversed, wrong-title and wrong-caption copies assert sample failures; console/page/transition faults retain render phase.
Pending user decision: None.
Evidence: `resolve-source-context.txt`; `resolve-unit-development.log` includes cause-chain classification.

## D-09: Resolve findings — executable template resolution and capture boundary

Step: Resolve findings 8 and 9, I-5 and I-37.
Question: What production operations should the integration tests invoke to prove lookup and configured settling?
Requirement: Lookup is relative to the distributed skill rather than caller cwd; each screenshot waits for configured transitions to settle.
Decision: Ship and document a skill-relative templates.mjs resolver; INT-001 invokes it in a separate process from an empty external directory for both template kinds. Make captureSettled own the sole configured wait and return DOM state observed immediately before screenshot capture. INT-002 uses a real 1100ms Web Animation and a 1300ms configured interval, so substituting the default 800ms wait leaves step 2 moving. Keep browser errors checked after the capture callback as well as before it.
Alternatives: Construct template paths only inside test code, or inspect settled text after screenshots following redundant default waits (both audited test gaps).
Rationale: Tests now exercise public lookup from the unrelated cwd and the actual pre-capture boundary, independently of the default delay.
What breaks if wrong: Template lookup fails outside the source cwd, or screenshots capture moving states despite later settled metadata.
Pending user decision: None.
Evidence: `resolve-source-context.txt`; `resolve-unit-development.log` includes the controlled-clock pre-screenshot ordering test. Targeted integration outputs will be saved as `resolve-INT-001.log` and `resolve-INT-002.log`.

## D-10: Before-pr review — preview lifecycle and termination

Step: Current review cycle 0, R1 and R2.
Question: How should a signal-dead preview and the first termination signal affect verification/inspection?
Requirement: Verification must fail actionably and clean up rather than hang; the current review requests conventional immediate signal termination.
Decision: Observe exit/error immediately after spawn, consider the child alive only when both exitCode and signalCode are null, and skip waiting on already-dead or spawn-failed children. SIGINT/SIGTERM handlers stop the child and explicitly exit with 130/143; normal completion still closes Chromium and removes both handlers.
Alternatives: Attaching the exit listener only during cleanup misses already-fired exits. Merely stopping the child consumes the signal and leaves the script waiting for browser timeouts. An asynchronous shutdown/re-raised signal was possible, but the explicitly suggested conventional exit avoids that timeout path.
Rationale: Node signal exits do not populate exitCode; early observation and explicit signal exit address the two independent failure modes.
What breaks if wrong: A signal-killed preview can still hang or Ctrl-C can require a second signal. Unit tests simulate signal death during readiness/callback, synchronous cleanup exit, spawn error, conventional exit codes and listener removal without creating processes or opening a browser.
Pending user decision: None.
Evidence: `review-R1-unit.log` and `review-R1-R2-unit.log` under evidence/.

## D-11: Before-pr review — viewport input domain and artifact replacement

Step: Current review cycle 0, R3.
Question: Should viewport validation impose the suggested 200–4000 width range, and which artifacts should a rerun replace?
Requirement: Invalid width must fail before build/filesystem work; reruns must not leave screenshots from previous longer presentations. The approved definition imposes no 200px minimum or 4000px maximum.
Decision: Validate both viewport axes as positive integers before build or filesystem work, preserving valid dimensions without adding an arbitrary range restriction. Parse CLI options through an exported function used by the actual entry point. Remove/recreate only the exact presentation/viewport generated output directory before capturing; preserve other presentation/viewport artifacts.
Alternatives: Add the suggested numerical limits (would impose a new scope restriction), wait for Playwright to reject NaN after building, or leave stale screenshots beside the new report.
Rationale: This fixes malformed input and stale output without changing the approved viewport contract or unrelated artifact sets.
What breaks if wrong: Malformed dimensions can waste a build/create junk directories, or a shorter rerun can expose stale images as current. Unit tests cover missing/non-numeric/non-positive/fractional widths, invalid heights, default/valid parsing, and a three-step then one-step run with sibling artifacts preserved.
Pending user decision: None.
Evidence: `review-R3-unit.log` under evidence/.

## D-12: Acceptance round 0 — A-001 fixed-canvas label readability

Step: Triage acceptance-findings.md A-001; acceptance-round-status.txt reports NOT_READY for tested revision 3cc4f166.
Question: How can the reference scene remain readable at 390×900 without reflowing its fixed composition, changing the normative story, or styling the reusable kit?
Requirement: Important diagram text must remain readable; the diagram uniformly fits a fixed canvas; stable entities accumulate without repositioning between beats. The default canvas is 880×380 when a presentation does not override it. Per-presentation canvas dimensions are already supported by Presentation/Stage.
Decision: Treat the reproduced unreadability as an implementation defect and fix it. Give the reference presentation one 880×1200 design canvas at every viewport, with 36px or larger scene typography (at least 12 screen pixels when fitted at 390×900). Increase entity heights and use short card headings plus separate title/caption/visual lines so labels fit their cards. Keep the conversation row, horizontal accumulating card tray, kit socket, verify-after-cards position, modify arc and reveal frame. Keep all nine normative titles/captions, entity IDs and per-beat accumulation order. Keep kit defaults at 880×380 and all visual changes in presentation-owned files.
Alternatives: Continuing to shrink the old 8px labels is the reproduced defect. A narrow-only reflow or disconnected alternate diagram would change the fixed-composition behavior. Duplicating the text in an auxiliary reading panel would leave the central scene itself unreadable. A single taller authored canvas uses the existing override contract without introducing those behaviors.
Rationale: The old aspect ratio left too little vertical room for larger labels inside small cards. A taller fixed composition can fit the available stage at both desktop and narrow sizes while retaining readable text and stable positions. Exact entity coordinates, shapes and visual design were deferred to the implementation in the approved outline.
What breaks if wrong: Platform font metrics could still cause text overflow or the visual composition could be unsatisfactory despite the computed text-size floor. Unit checks therefore cover all nine beats in both modes, default-kit dimensions and stable geometry on resize. An added E2E-001 production regression measures rendered narrow-view text size, canvas/card containment and uniform scaling with real browser metrics. Browser/acceptance checks are not run in this fix turn, as instructed, so subjective visual acceptance is not claimed.
Integration/end-to-end regression assessment: Meaningful and practical; extend the existing E2E-001 registered-route journey and reuse its production build, rather than adding another build-heavy suite. The added assertions cover actual font metrics and text bounds, which unit DOM simulation cannot prove.
Pending user decision: None; no approved requirement is waived or changed.
Evidence: `acceptance-A-001-unit-development.log` records the initial passing targeted unit regression. Final per-group unit results will be saved as `acceptance-A-001-unit.log`, `acceptance-I-15-unit.log`, `acceptance-I-16-unit.log`, `acceptance-I-26-unit.log`, `acceptance-I-29-unit.log`, and `acceptance-I-30-unit.log` under evidence/. Only the supplied findings report and round-status file were read; tester evidence files were not audited.

## D-13: Acceptance review — R4 uniform owner bounds and fallback-font room

Step: Current review cycle 1, open R4. Closed R1–R3 were read for history and not acted on.
Question: How should the browser regression detect overflow in all scene entities while preserving readable intentional overlap and accommodating wider fallback fonts?
Requirement: Important labels must remain readable without accidental collisions; authored entities remain stable on one uniformly scaled canvas; intentional readable overlaps can be explicitly marked. R4 identifies a confirmed coverage gap, not a reproduced rendering overflow.
Decision: Replace the step-card-only condition with the same owner-containment predicate for every visible label, require an entity owner for each reference-scene label, and keep an independent whole-canvas containment check. Share the predicate between unit policy tests and the browser assertions. Exercise default and wide fallback fonts in the existing browser regression. Preserve the intentional reveal-label/frame-border overlap using an explicit marker on that label alone; the marker never exempts whole-canvas bounds. No verify/kit/ghost label is exempted.
Implementation room: Widen/pad the verify node and show build/render/pass as explicit lines, allow fallback word wrapping without reducing the 36px minimum font, increase verify/kit heights, and extend the authored canvas height to 1280 so the socket and reveal still fit. Keep row ordering and stable coordinates across beats. Use a single ellipsis for the ghost and bounded SVG arrows instead of overflowing text arrow glyphs. Keep kit defaults and templates unchanged.
Alternatives: Retain a class-specific check (misses the reported cases), clip text or shrink it (hides content or reverses the acceptance readability fix), or blanket-exempt owner checks (would conceal accidental overflow). Moving the deliberate reveal label solely to satisfy a containment pattern would unnecessarily discard intentional composition.
Rationale: Geometry assertions should test labels against their actual owner rather than only the canvas; extra layout room and wrapping address the wider fallback-font risk without changing the narrative or introducing viewport-specific reflow.
What breaks if wrong: A fallback font could still overflow an entity or an overly broad exception could hide a collision. Unit tests reject spill beyond each edge for verify, kit, ghost and card-like bounds; check rounding tolerance and explicit owner overlap without excusing canvas overflow; and ensure only the reveal label carries the marker. Rendering remains unverified in this turn because browser/integration/end-to-end tests are prohibited.
Pending user decision: None; no approved requirement was changed or waived. No decline was recorded.
Evidence: `review-R4-unit-development.log` captures a corrected CSS-serialization assertion; `review-R4-unit.log` records 18 passing affected cases, including the shared containment predicate and the current scene typography/geometry. Final dependent unit group logs are `review-R4-I-15-unit.log`, `review-R4-I-16-unit.log`, `review-R4-I-26-unit.log`, `review-R4-I-29-unit.log` and `review-R4-I-30-unit.log` under evidence/.

## D-14: Acceptance round 1 — A-002 unbroken morph label

Step: Read the current acceptance findings and NOT_READY status for tested revision 986ef34a. A-001 is explicitly reported resolved and was not reopened. A-002 reproduces the word morph splitting onto two lines at both narrow and desktop sizes.
Question: How should a short connector word stay readable on one line without reversing the prior text-size fix or changing the stable diagram geometry?
Requirement: What morphs is labelled on the inter-card link, with readable text and uniform fixed-canvas scaling. Presentation-owned typography is a deferred visual-design choice; accidental word splitting is not an intended overlap or an acceptable rendering defect.
Decision: Fix A-002. Keep the label at 36px in design coordinates, use a regular generic monospace face for predictable five-character advance, and explicitly disable whitespace wrapping, arbitrary overflow wrapping and word breaking on that label only. Keep all entity coordinates, the authored canvas, colors, narrative, font-size floor and existing owner/canvas bounds assertions. Do not clip or ellipsize the word. In the browser fallback-font fixture, use a monospace fallback for this now-monospaced label while retaining the wider proportional-font fixture for other entities.
Alternatives: Allow morp/h (the reproduced defect), reduce the font size (would regress A-001 readability), or move neighbouring entities/increase gaps (unnecessary composition changes). Compressing glyphs or clipping excess letters would conceal rather than solve the label problem.
Rationale: The previous generic overflow-wrap rule was appropriate for multiword box content but not for a five-character connector word. A stable monospaced word at the same font size avoids the proportional semibold width that caused the split without introducing viewport-specific reflow.
What breaks if wrong: An unusually wide monospace fallback could still exceed the owner even though it no longer wraps. The browser regression therefore retains owner/canvas containment and minimum rendered font size, additionally asserts exactly one rendered text fragment for every morph label, and checks expected label presence. Unit CSS checks cover both 390px and 1440px widths and all beats in which the label exists, including persistence and absence of clipping/ellipsis.
Integration/end-to-end regression assessment: Meaningful and practical; extend the existing E2E-001 production route regression with text Range fragment-count assertions and correct fallback font categories. No extra build/server suite is needed. The browser test is added but not run in this turn, as instructed; a new visual acceptance outcome is not claimed.
Pending user decision: None; no approved requirement was changed or waived.
Evidence: `acceptance-A-002-unit.log` under evidence/ records seven passing affected cases, including both new word-wrap regressions and the existing A-001 readability/geometry and I-29/I-30 scene checks. Tester evidence files were not opened or audited; the supplied findings report is the source of the reproduced behavior. Additional isolated scene logs are `acceptance-A-002-I-29-unit.log` and `acceptance-A-002-I-30-unit.log`.

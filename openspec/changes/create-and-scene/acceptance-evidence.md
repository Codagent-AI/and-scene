# Acceptance evidence: create-and-scene

Journeys AT-001, AT-002, AT-004 and the sample-provenance check were executed
in disposable directories under `/tmp/at/` by the implementing agent, who played
both the user and the agent following `skills/presentation/SKILL.md`. The
interview answers were therefore scripted by the same agent, not by an
independent person. Every build, render and inspection below was real; the
source repository was not modified by these runs. Directories are deleted after
this evidence was captured.

## AT-001 Scaffold the correct target and create through the skill

**Standalone, empty directory** (topic "How Coffee Brewing Works"; style warm
dark browns; steps "Grind fresh beans", "Heat the water", "Pour and serve";
the user left the exact water temperature open and chose to proceed with partial
detail, so the agent used 94 degrees and noted it).

- `scaffold.mjs detect .`: target = the directory root, missing = build, kit,
  index, `confirmationRequired: false`.
- `bootstrap .` (real `npm install`), then `new . coffee-brewing "How Coffee Brewing Works"`.
- Presentation-owned CSS and scene written in `src/presentations/coffee-brewing/`; kit untouched.
- `npm run build` ok; `npm run verify`: `rendered coffee-brewing: 3 steps`, PASS;
  `npm run inspect -- coffee-brewing` desktop and `--narrow`: 3 screenshots each, 0 warnings.
- Screenshots reviewed: first, last (step 3, densest) wide, plus narrow.

**Non-empty monorepo, only the build anchor present** (root `package.json` with
`workspaces`, README, `packages/lib`).

- `detect`: target `<root>/presentations`, `monorepo: true`, `confirmationRequired: true`.
- `bootstrap .` without `--confirmed`: exit 2, message asks for confirmation;
  file listing identical before and after (nothing written).
- After the user confirms the stated target: `bootstrap . --confirmed`.
  `diff -r` of the root against its pre-run snapshot (excluding `presentations/`): no differences.
- `new presentations mono-demo "Monorepo Demo"`, build ok, verify PASS.
- First inspection reported 4 warnings (indistinct active dot, browser-default
  attribution at steps 1 and 2) on the unstyled template. The agent added
  presentation CSS; rerun: 0 warnings desktop and narrow; verify PASS.

## AT-002 Preserve existing presentations and scope a modification

- Scaffolded app with two presentations (`starter`, `coffee-brewing`). `detect`:
  already scaffolded, `needsScaffold: false`, nothing overwritten.
- `new tea-steeping`: `diff -r` of `src/` before/after shows only the new
  folder and one added registry entry.
- Ambiguous request ("change a presentation"): agent listed the registry slugs
  (`starter`, `coffee-brewing`, `tea-steeping`); the user chose `coffee-brewing`
  and asked for the step 2 caption to say 93 degrees and a greener heading.
- Only `coffee-brewing/steps/index.ts` and `presentation.css` changed (`diff -rq`).
- `npm run verify`: starter 2, coffee-brewing 3, tea-steeping 2 steps, PASS;
  inspect: 0 warnings. Before/after screenshots of step 2 captured.

## AT-004 Repair verification and visual-warning failures

Seeded presentation `seeded`: type error, then a runtime `console.error`, an
accidental text collision, unstyled active navigation, default attribution, and
one intentional stacked pair.

1. `npm run build` failed: `Scene.tsx(9,9): error TS2322: Type 'string' is not assignable to type 'number'.` Not reported as done; fixed.
2. Build ok, `npm run verify` failed: `[verify] FAIL phase=render step=0: seeded: console.error: seeded runtime fault`. Fixed; rerun PASS.
3. First inspection: 6 warnings: active-chrome and attribution at both steps;
   overlap of `subject box`/`detail label` (accidental) and `stack back`/`stack front` (intentional).
4. Agent moved the detail label clear of the subject, kept the stack, made both
   stacked cards transparent so both labels are readable (a first attempt with
   opaque cards hid "stack back" and was rejected after viewing the screenshot),
   marked only the stack wrapper with `data-presentation-allow-overlap`,
   and styled the active dot, ToC entry and attribution. Final inspection: 0 warnings;
   verify PASS. The marker appears once, on the stack wrapper.

## Sample provenance

The skill's `new` output for slug `how-to-make-a-presentation` is `Talk.tsx`,
`entities.ts`, `presentation.css`, `steps/` and one registry entry. The committed
sample uses the same layout and an identical registry entry (text diff after
quote normalization). The committed sample content was then applied on top of
that skill-generated skeleton in a skill-bootstrapped app: build ok, verify
rendered it as 9 steps against the normative outline in `scripts/verify.config.json`, PASS.
The sample itself was authored by the implementing agent following the
skill's structure rather than through an interactive interview.

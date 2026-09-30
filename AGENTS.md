# And Scene Evaluation Fixture

This branch is the pre-implementation fixture for the And Scene evaluation.
Implement the `create-and-scene` OpenSpec change in this repository and verify
both behavior and visual composition before reporting completion. The target
application, skill, scene kit, and scripts intentionally do not exist yet.

## Source of Truth

- `openspec/changes/create-and-scene/proposal.md`: scope and motivation
- `openspec/changes/create-and-scene/design.md`: architecture and implementation decisions
- `openspec/changes/create-and-scene/specs/`: canonical behavioral requirements
- `openspec/changes/create-and-scene/tasks/`: ordered implementation work

Read the proposal, design, canonical specs, and all task files before editing.
Treat the canonical specs as authoritative when task summaries are less
detailed. Keep implementation work inside the repository; do not alter the
evaluation harness or fixture history.

## Target Project Map

The change creates these primary areas:

- `skills/presentation/`: distributable agent skill and scaffold templates
- `src/presentation-kit/`: canonical vendored React scene kit
- `src/presentations/`: worked presentation and registry
- `scripts/verify.mjs`: deterministic build and browser-render verification
- `scripts/inspect-presentation.mjs`: screenshot capture and visual-quality diagnostics

## Browser Tooling

Use `chrome-devtools-axi` for agent-driven browser inspection and debugging.
It is installed in the evaluation sandbox and provides a concise CLI over
Chrome DevTools:

```bash
chrome-devtools-axi open http://127.0.0.1:5173/
chrome-devtools-axi snapshot
chrome-devtools-axi screenshot /tmp/and-scene.png
```

Start with `snapshot` to inspect page structure, then use screenshots for visual
composition. Inspect the first, last, and dense or visually important steps;
also inspect a narrow viewport when the presentation is responsive-sensitive.
Use `chrome-devtools-axi --help` for the full command list. Do not invoke the
underlying Chrome DevTools MCP server directly when AXI is available.

Keep deterministic project verification in the repository's Playwright-backed
scripts. AXI is the interactive inspection interface; `npm run verify` remains
the automated browser gate. Do not substitute manual AXI inspection for the
repository checks required by the specs.

## Implementation Workflow

Use test-driven development for behavior changes and bug fixes: add a focused
failing test, implement the smallest fix, then run the targeted test before the
full suite. Tests are not required for prose-only documentation or
configuration-only changes.

Once the project scaffold exists, use:

```bash
npm ci
npm test           # Vitest unit and contract tests
npm run lint       # ESLint
npm run build      # TypeScript and production build
npm run verify     # build plus browser-render verification
npm run inspect -- how-to-make-a-presentation
```

## Change Guidelines

- Keep `src/presentation-kit/` byte-aligned with its bootstrap-template copy.
- Keep root verification and inspection scripts aligned with their bootstrap
  template copies when changing scaffolded behavior.
- Preserve the style-neutral kit contract. Presentations own colors,
  typography, spacing, and component treatments; do not add a required CSS
  framework or design system to the kit.
- Expose stable `data-presentation-*` hooks and active-state semantics required
  by the specs and visual inspection tooling.
- Use `127.0.0.1` for local browser automation to avoid IPv4/IPv6 resolution
  differences.
- Do not commit generated build output, dependency directories, or inspection
  screenshots.

Before reporting completion, run the full test, lint, build, and verify suite.
Also inspect representative first, last, dense, and responsive-sensitive steps
with AXI and the project-local screenshot helper.

## Commit Messages

Use `type: lowercase description`, where `type` is `fix`, `feat`, `docs`,
`test`, `refactor`, or `chore`.

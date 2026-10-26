`verify.mjs` builds the entire app, starts Vite's production preview on an ephemeral
IPv4 loopback port, validates registration and each step, and returns a non-zero
exit code with phase/step diagnostics on failure. Root default selects the strict
nine-step canonical sample; `--slug` selects another registered presentation.
Chromium must be installed with `npx playwright install chromium` first.

`inspect-presentation.mjs` shares the preview lifecycle, captures settled desktop
screenshots per step, and writes `report.json` with timestamps and advisory
warnings. It does not fail merely because a visual warning exists. It fails on
operational errors such as an unreachable route or stalled transition. It does
not replace independent visual review.

Keep these scripts and the bootstrap snapshot byte-aligned. Do not invoke the
inspection helper to replace the separately authorized acceptance workflow.

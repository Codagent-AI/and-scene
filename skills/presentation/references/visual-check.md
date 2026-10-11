# Review composition

Review the local helper's `artifacts/inspect/<slug>/<viewport>/report.json` and
settled screenshots for the first, final, and densest/key beats. Ensure scene
content fits its canvas, captions do not collide with controls, continuing entities
remain in place, current navigation differs from inactive controls, and attribution
is readable. Inspect responsive work at desktop and 390×844. Fixed-canvas scaling
preserves composition rather than reflowing it; inspect small text deliberately.

Treat warnings as advisory evidence, not as success/failure or aesthetic scores.
Fix accidental collisions and local chrome polish. Exempt only readable intentional
overlap, on the smallest relevant subtree. If a warning is a heuristic false
positive, document its step and reason after visually reviewing the screenshot;
do not blanket-exempt the scene to silence diagnostics. Rerun inspection after
fixes and report any remaining reviewed warnings. Build/render failures always
block success; manual screenshots never replace the automated verification gate.

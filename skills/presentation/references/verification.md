# Verification reference

## Build

`npm run build` must complete with zero type/build errors. Fix and re-run on
any failure; never report completion with a broken build.

## Render check

`npm run verify` (from `templates/bootstrap/scripts/verify.mjs` once
scaffolded) builds the app, starts `vite preview` on `127.0.0.1`, and for
every registered route steps through it via the `data-step-count` /
`data-step-index` chrome hooks, failing on any console error, uncaught page
error, or a step index that doesn't advance. It names the failing route and
step.

Running the full suite on every intermediate edit is slow. It's fine to check
just the new/changed presentation's first step while iterating, but run the
full `npm run verify` before reporting the task done — never report success
while any render check is failing.

## Visual composition check

`npm run inspect -- <slug>` (from
`templates/bootstrap/scripts/inspect-presentation.mjs`) captures a settled
screenshot per step under `inspection/<slug>/step-N.png` and prints advisory
warnings:

- **Unmarked overlap** — two visible text/chrome elements' bounding boxes
  intersect and neither is inside an element carrying
  `data-presentation-allow-overlap`. Fix accidental collisions (reposition,
  resize, or reduce content); for a genuinely intentional readable overlap,
  add `data-presentation-allow-overlap` to the containing element instead of
  suppressing the warning elsewhere.
- **Indistinct active state** — the active progress dot or table-of-contents
  entry (`data-presentation-active="true"`) has the same computed
  background/color/font-weight/border as an inactive one. Style
  `[data-presentation-active="true"]` in the presentation's CSS.
- **Unpolished attribution** — the `[data-presentation-attribution]` link is
  under 11px or still browser-default blue. Style it via that hook.

These warnings are advisory, not pass/fail — review every one named in the
output, fix what's accidental, and only mark composition that is genuinely
intentional. Inspect at minimum the first step, the last step, and the
densest/most complex step; add a narrow-viewport pass
(`--viewport=390x844`-style) for a presentation that is responsive-sensitive.

Prefer this project-local helper over writing an ad hoc Playwright script
outside the project tree — it resolves browser tooling from the project's own
dependencies and already captures post-animation, settled screenshots.

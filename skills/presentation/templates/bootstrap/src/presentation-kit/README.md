# Presentation kit hooks

The kit has no visual stylesheet. Authors own every visual treatment through
their own stylesheets and the `className`, `style`, and `data-*` props on nodes.
Stable hooks include `data-presentation-active="true"` with `aria-current="step"`
for the selected progress/section control, `data-presentation-attribution` for
the default disclosure link, and `data-presentation-allow-overlap` for intentional
overlap. Chrome exposes `data-step-count` and zero-based `data-step-index`.
The header brand slot is host supplied; no kit brand is rendered by default.

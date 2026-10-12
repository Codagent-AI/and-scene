# Presentation kit

Style-neutral scene behavior and layout plumbing. Authors provide all color,
typography, borders, spacing, and component appearance in their presentation.

## DOM hooks

The kit exposes `data-presentation-root`, `data-presentation-mode`,
`data-presentation-stage`, `data-presentation-canvas`, `data-presentation-header`,
`data-presentation-footer`, `data-presentation-caption`,
`data-presentation-title`, `data-presentation-progress`,
`data-presentation-progress-indicator`, `data-presentation-step-index`,
`data-presentation-toc`, `data-presentation-toc-entry`,
`data-presentation-prev`, `data-presentation-next`,
`data-presentation-attribution`, `data-presentation-mode-toggle`,
`data-presentation-marker`, and hooks for each primitive (`box`, `label`,
`arrow`, `frame`, `emphasis`, `symbol-chip`, `appear`, `scene-layer`).

The footer exposes exact `data-step-count` and `data-step-index` attributes.
Active progress and ToC entries expose `aria-current="step"` and
`data-active="true"`; inactive entries expose `data-active="false"`.
Scene layers may carry `data-presentation-allow-overlap` to document intentional
overlap for inspection tools. Host branding is opt-in. Attribution defaults to
the and-scene GitHub repository.

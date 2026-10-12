# Presentation kit

This directory is the style-neutral scene engine. It supplies motion, fixed
canvas layout, navigation behavior, and stable hooks. Presentations own colors,
fonts, spacing, borders, shadows, and control treatments.

## DOM hooks

- Chrome root: `data-step-count`, `data-step-index`, `data-presentation-mode`
- Chrome parts: `data-presentation-header`, `-marker`, `-title`, `-caption`,
  `-progress`, `-progress-item`, `-toc`, `-toc-item`, `-prev`, `-next`,
  `-mode-toggle`, `-stage`, `-canvas`, `-footer`, `-attribution`
- Active progress and TOC entries: `aria-current="step"` and
  `data-presentation-active="true"`
- Scene primitives identify their stable entity with `data-presentation-node`
- `data-presentation-allow-overlap` marks a subtree with intentional overlap
  for the screenshot inspection helper.

The default attribution is `made by and-scene` linking to
`https://github.com/Codagent-AI/and-scene`. Pass `attribution` to
`<Presentation>` to override it. Header branding is opt-in through `brand`.

# Styling

- Default: **plain CSS** in `src/presentations/<slug>/talk.css`, imported by `Talk.tsx`. Scope with a per-presentation
  class prefix and `[data-presentation-*]` selectors. Put palette/type tokens on `[data-presentation-root]`.
- Use Tailwind or another framework only if the host project already uses it or the user asks for it.
- Never add styling to `src/presentation-kit/` or define theme tokens in the host `src/index.css`.
- Style the chrome: header, marker, footer title/caption, controls, progress items, ToC items.
- The **active** progress/ToC item (`[data-presentation-active='true']`) must be visibly different (weight, color,
  background, or marker) from inactive ones.
- The attribution link (`[data-presentation-attribution]`) must be legible: sufficient contrast and a readable size,
  not hidden behind scene content.
- Keep scene content clear of the chrome regions; if text and chrome must overlap, mark the scene element with
  `data-presentation-allow-overlap` only when the overlap is intentional and readable.

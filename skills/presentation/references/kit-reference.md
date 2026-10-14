# Scene kit reference (`src/presentation-kit`)

The kit owns behavior, canvas geometry, and DOM hooks only — no colors, fonts, borders, or themes. Import from
`../../presentation-kit`.

- Primitives: `Box` (optional `icon`), `Label`, `Frame`, `SymbolChip`, `Arrow` (`from`/`to` points), `Emphasis`,
  `Appear` (wrap newcomers only), `SceneLayer`. All take `id` (the `layoutId`), `className`, `style`, `data-*`.
- Presentation: `<Presentation steps title initialMode="browse|present" attribution brand />`.
- Navigation: →/Space/PageDown next, ←/PageUp previous, `P` toggles present/browse, swipe.
- Constants: `DESIGN_W = 880`, `DESIGN_H = 380`, `EASE`, `LAYOUT_T`, `ENTER_T`, `ENTER_DELAY`.

Style hooks (all `data-presentation-*`): `root`, `mode`, `header`, `marker`, `deck-title`, `mode-toggle`, `footer`,
`step-title`, `caption`, `controls`, `prev`, `next`, `progress`, `progress-item`, `toc`, `toc-item`, `era`,
`active="true"` (active progress/ToC item), `attribution`, `stage`, `canvas`, `scale`, `scene`, `node="…"`, `id`.
`data-presentation-allow-overlap` exempts an intentional readable overlap from diagnostics.

The full table lives in `src/presentation-kit/README.md` in the scaffolded app.

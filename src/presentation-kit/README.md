# Scene kit

A presentation supplies an ordered `Step<TPayload>[]`, a title, and (optionally)
`initialMode`, `brand`, `attribution`, and `className` to `Presentation`.
Each step supplies `id`, `era`, `title`, `caption`, `Scene`, and `payload`.
For a scene with no data, use the default payload type and `payload: undefined`.
`SceneProps<TPayload>` keeps payloads typed at the presentation boundary.

Adjacent steps with the same `groupKey` and the same `Scene` component update the
existing scene instance. A different group or component begins a cross-fade;
shared `layoutId`s continue to project through the enclosing `LayoutGroup`.
Use presentation-specific identity namespaces to avoid accidental collisions.

Continuing entities use primitives (or raw Motion elements) with stable
`layoutId`s directly. Wrap only newcomers in `Appear`, keyed inside an
`AnimatePresence` owned by the scene; entry waits `ENTER_DELAY` for layout motion
to settle, while exit is immediate. `SceneLayer` positions diagrams absolutely.
Never use a new `Appear` wrapper for an entity that continues between beats.

`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, and `SymbolChip` provide identities,
motion, and hooks; their shapes and visual treatments come from the author.
Arrow content can be a glyph, SVG, or other author-supplied markup. `Box` accepts
an optional `Icon: LucideIcon`. All nodes forward class, style, and data hooks.
The kit adds no CSS. Canvas and chrome geometry are constant per mode and do not
depend on step content; keep narration within the reserved chrome regions.

Navigation: Right / Space / PageDown advances, Left / PageUp goes back, and P
switches browse/present modes. Focused interactive controls retain their keys.
Horizontal touch swipes navigate; progress buttons jump to a step, and table of
contents buttons jump to the first step of an era. Numbering follows array order.
Attribution defaults to `made by and-scene`, can be replaced with `{ label, href }`,
or disabled with `false`. Header branding is empty unless supplied explicitly.

The chrome root exposes `data-step-count`, `data-step-index`,
`data-presentation-chrome`, and `data-presentation-mode`. Active progress and ToC
buttons expose `data-presentation-active="true"` with `aria-current`. Authors own
active-state styling and attribution legibility. The `data-presentation-*` hooks
on narration, stage, nodes, and controls are the public inspection contract.
`ALLOW_OVERLAP_ATTRIBUTE` exports `data-presentation-allow-overlap`; apply this
subtree marker only to intentional, readable overlap. Inspection tooling consumes
it; the kit does not alter a marked composition.

Canonical files in this directory must stay byte-aligned with
`skills/presentation/templates/bootstrap/src/presentation-kit/`.

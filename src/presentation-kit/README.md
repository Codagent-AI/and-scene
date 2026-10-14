# presentation-kit

Style-neutral engine for evolving-scene presentations. A presentation supplies
`entities.ts` + `steps/*` and renders `<Presentation steps={…} title="…" />`.

## Contract

The kit owns **behavior, fixed-canvas layout geometry, and DOM hooks only**. It sets
no palette, font, border, shadow, card, button, spacing or theme defaults, ships no
CSS files, and depends on no styling framework. Presentations and the host own all
visual styling (`[data-presentation-*]` selectors). Imports outside the kit are
limited to `react`, `react-dom`, `motion`, and `lucide-react`.

## Step model

`Step<TPayload>` = `{ id, era, title, caption, Scene, groupKey?, payload? }`.
Adjacent steps with the same `groupKey` and `Scene` keep one scene instance; only
`payload` changes. Step numbers derive from position. Typed payloads pass through
`<Presentation>` without casts.

## Constants (`constants.ts`)

`EASE`, `LAYOUT_T`, `ENTER_T`, `ENTER_DELAY`, `DESIGN_W = 880`, `DESIGN_H = 380`,
`MIN_SCALE`, `WIDE_VIEWPORT_MIN`, `STAGE_LAYOUT { browse, present }`,
`ATTRIBUTION_URL` (`https://github.com/Codagent-AI/and-scene`), `ATTRIBUTION_LABEL`.

## Navigation

`→`/`Space`/`PageDown` next, `←`/`PageUp` previous, `P` toggles present/browse,
horizontal swipe (left = next, right = previous). Clamped at both ends. Keys are
ignored while an interactive control (button, link, input, …) has focus.

## DOM hooks

| Hook | Where |
| --- | --- |
| `data-presentation-root`, `data-presentation-mode="present\|browse"` | root |
| `data-step-count`, `data-step-index` (zero-based) | root |
| `data-presentation-header`, `-brand` (host-supplied only), `-marker`, `-deck-title`, `-mode-toggle` | header |
| `data-presentation-footer`, `-title` (present), `-step-title`, `-caption`, `-controls`, `-prev`, `-next` (browse) | footer |
| `data-presentation-progress`, `data-presentation-progress-item` | progress dots |
| `data-presentation-toc`, `data-presentation-toc-item`, `data-presentation-era` | ToC (browse, wide) |
| `data-presentation-active="true"` | active progress/ToC item only |
| `aria-current="step"` / `aria-current="true"` | active progress item / ToC item |
| `data-presentation-attribution` | bottom-right attribution link |
| `data-presentation-stage`, `-canvas`, `-scale`, `-scene` | stage |
| `data-presentation-node="box\|label\|frame\|arrow\|symbol-chip\|emphasis\|appear\|scene-layer"`, `data-presentation-id`, `data-presentation-glyph`, `data-presentation-emphasized` | primitives |
| `data-presentation-allow-overlap` | author-placed marker exempting a subtree from overlap diagnostics (no behavior in the kit) |

## Attribution and branding

A `made by and-scene` link renders bottom-right by default; override with
`attribution={{ label, href }}` or `false`. No top-left brand is rendered; hosts may
pass `brand={<…/>}`.

## Primitives

`Box` (optional `icon: LucideIcon`), `Label`, `Frame`, `SymbolChip`, `Arrow`,
`Emphasis`, `Appear` (wrap newcomers only, never continuing entities), `SceneLayer`.
All accept `id` (the `layoutId`) plus `className`/`style`/`data-*`. Use raw `motion`
elements with stable `layoutId`s when a primitive is not the right shape.

# presentation-kit

Style-neutral scene kit: motion behavior, fixed 880×380 canvas with uniform fit
scaling, navigation, present/browse chrome, and stable DOM hooks. It ships no CSS,
colors, fonts, borders, or shadows; presentations style it via the hooks below.
It imports only npm packages (`react`, `motion`, `lucide-react`).

Usage: `<Presentation steps={STEPS} title="…" initialMode="browse" brand={…} attribution={…} />`.
Steps sharing `groupKey` and `Scene` keep one scene instance; only `payload` changes.

Entities that leave a step fade out instead of vanishing: node primitives carry an `exit` animation, and
`SceneLayer` (or `Presence`, for any other parent) keeps removed children mounted until it finishes. Render
departing entities as direct children of `SceneLayer` or `Presence`; nested inside a plain element they unmount at once.

## Stable hooks (`data-presentation-*`)

| Hook | Element |
| --- | --- |
| `data-presentation-root` | root; also carries `data-step-count`, `data-step-index`, `data-presentation-mode` (`browse`\|`present`) |
| `data-step-count`, `data-step-index` | root chrome element (zero-based index) |
| `data-presentation-header`, `-brand`, `-marker`, `-marker-number`, `-marker-total`, `-title`, `-mode-toggle` | header (brand slot is empty unless host passes `brand`) |
| `data-presentation-footer`, `-narration`, `-step-title`, `-caption`, `-nav`, `-prev`, `-next` | footer (caption and nav only in browse mode) |
| `data-presentation-progress`, `-progress-dot` | progress indicators; active dot has `aria-current="step"` |
| `data-presentation-toc`, `-toc-entry` | era table of contents (browse, wide viewports); active entry has `aria-current="location"` |
| `data-presentation-active="true"` | active progress dot / ToC entry / `Emphasis` |
| `data-presentation-attribution` | the bottom-right `made by and-scene` link |
| `data-presentation-stage`, `-canvas`, `-scale`, `-scene` | stage, fixed canvas, current scale, scene host |
| `data-presentation-node` (`box`, `label`, `arrow`, `frame`, `emphasis`, `symbol-chip`, `appear`), `-id`, `-layer`, `-icon`, `-frame-label`, `-symbol` | node primitives |
| `data-presentation-allow-overlap` | put on a subtree whose text/chrome overlap is intentional; inspection tooling skips it |

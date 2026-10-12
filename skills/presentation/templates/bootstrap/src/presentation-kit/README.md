# Presentation kit hooks

The kit provides layout and behavior only; presentations own all visual styles.
Nodes and chrome accept normal class/style/data attributes for host styling.

Stable hooks:

- Root and navigation state: `data-presentation-root`, `data-step-count`,
  `data-step-index`, `data-presentation-mode`, and
  `data-presentation-mode-toggle`.
- Chrome regions: `data-presentation-header`, `data-presentation-footer`,
  `data-presentation-title`, `data-presentation-step-marker`,
  `data-presentation-caption`, and `data-presentation-attribution`.
- Navigation: `data-presentation-progress`, `data-presentation-toc`, and
  `data-presentation-toc-entry`.
- Diagram: `data-presentation-stage`, `data-presentation-node`, and
  `data-entity-id`; newcomers wrapped in `Appear` expose
  `data-presentation-appear`; entities leaving a grouped scene are wrapped in
  `Departing` and expose `data-presentation-departing` while they animate out.

Active progress and ToC entries set both `aria-current` and
`data-active="true"`.

Mark an intentionally overlapping subtree with
`data-presentation-allow-overlap`; screenshot inspection tools should exempt its
descendants from overlap warnings. `Appear` is for newcomers; set
`isNew={false}` or omit the wrapper for continuing entities so layout projection
can morph them.

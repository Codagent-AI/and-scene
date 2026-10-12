# Presentation kit hooks

The kit provides layout and behavior only; presentations own all visual styles. Nodes and chrome accept normal class/style/data attributes for host styling.

Stable hooks: root `data-presentation-root`, `data-step-count`, `data-step-index`, and `data-presentation-mode`; stage `data-presentation-stage`; title `data-presentation-title`; caption `data-presentation-caption`; progress `data-presentation-progress`; ToC `data-presentation-toc-entry`; attribution `data-presentation-attribution`; generic entities expose `data-presentation-node` and `data-entity-id`. Active progress and ToC entries set both `aria-current` and `data-active="true"`.

Mark an intentionally overlapping subtree with `data-presentation-allow-overlap`; screenshot inspection tools should exempt its descendants from overlap warnings. `Appear` is for newcomers; set `isNew={false}` or omit the wrapper for continuing entities so layout projection can morph them.

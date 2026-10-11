# Presentation kit contract

The kit supplies scene behavior and canvas/chrome geometry. Presentations own all visual styling. Stable DOM hooks use the `data-presentation-*` namespace: chrome exposes `data-presentation-step-count`, `data-presentation-step-index`, and `data-presentation-mode`; active progress and ToC entries expose `aria-current="step"` and `data-presentation-active`; attribution uses `data-presentation-attribution`. Node hooks are documented by each primitive's corresponding data attribute. Set `data-presentation-allow-overlap` on an intentional overlapping subtree for inspection tooling.

The host may supply `brand` to `Presentation`; the default header slot is empty. Default attribution points to https://github.com/Codagent-AI/and-scene.

A grouped scene persists across steps, so an entity it stops rendering is removed immediately unless it sits under an exit boundary. Wrap conditionally rendered entities in `Presence` and give each a stable `key`, e.g. `<Presence>{step < 4 && <Appear key="hint" id="hint">…</Appear>}</Presence>`; `Appear` then fades out on the transition.

# Scene kit contract

A `Step<TPayload>` is `{ id, era, title, caption, Scene, payload, groupKey? }`. Its `Scene` receives `{ payload, stepIndex }` as `SceneProps<TPayload>`. `<Presentation steps={...} title="..." initialMode="browse" />` hosts the typed step sequence. Use a shared `groupKey` and `Scene` for evolving states of one scene. Reuse stable `entityId` / `layoutId` values for continuing entities.

Available node primitives: `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, and `SceneLayer`. The kit owns behavior and fit geometry, not visual appearance. Consult the project's `src/presentation-kit/README.md` for its stable DOM hooks.

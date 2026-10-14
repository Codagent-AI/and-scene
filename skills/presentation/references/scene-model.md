# Evolving-scene model

- A presentation is **one scene** whose entities appear, move, collapse, connect, and re-label across steps.
- **Stable entity ids.** Every on-screen entity has a single id in `entities.ts` (the `layoutId`). The same id in
  consecutive steps morphs the entity; a new id makes a new entity. Never rename an id between steps to "restyle" it.
- **Grouped steps.** Adjacent steps that share `groupKey` and the same `Scene` component keep one scene instance;
  only `payload` changes. Put the whole story of a section in one `TalkScene` driven by `payload.step`.
- **Entity continuity.** Carry entities forward unless the narrative removes them; wrap only *new* entities in
  `<Appear>`; use `show={condition}` to enter/exit. Avoid redrawing the same thing with a different id.
- Prefer moving/resizing/re-labelling an entity over replacing it. Use eras (`era` in the outline) to group steps in
  the table of contents.
- Fixed canvas: 880 × 380 design units (`DESIGN_W`, `DESIGN_H`); position absolutely inside `SceneLayer`.

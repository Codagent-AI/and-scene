# Presentation template

Copy this folder to `<app>/src/presentations/<slug>/`, then:

1. Replace `__TITLE__` in `Talk.tsx` with the presentation title.
2. Rewrite `entities.ts` (the stable `layoutId` namespace and fixed coordinates) and
   `steps/index.ts` (one entry per step: id, era, title, caption, payload) for the topic.
   Keep one persistent `Scene` and one `groupKey` so entities morph in place.
3. Add presentation-owned plain CSS (for example `talk.css`, imported from `Talk.tsx`) for the
   look, including `[data-presentation-active="true"]` styling for progress and table-of-contents
   items and a legible `[data-presentation-attribution]`. Never put styling in the kit.
4. Register it with one line in `src/presentations/index.ts`.

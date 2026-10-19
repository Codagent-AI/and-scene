# Presentation template

Copy this folder to `src/presentations/<slug>/` and replace the placeholders:

- `__SLUG__`: the presentation's kebab-case slug. It prefixes every entity id in `entities.ts`.
- `__TITLE__`: the human-readable title shown in the page and the registry.

Files:

- `entities.ts`: the layoutId namespace and entity rects.
- `Scene.tsx`: the scene that reads a step's payload and renders entities.
- `steps/index.ts`: the ordered steps (stable `id`, `era`, `title`, `caption`, `groupKey`, `Scene`, `payload`).
- `Talk.tsx`: the entry that renders `<Presentation>` with the steps.
- `styles.css`: the presentation's own CSS.

Then add exactly one line to the explicit list in `src/presentations/index.ts`:

    { slug: '<slug>', title: '<title>', load: () => import('./<slug>/Talk') },

This README documents the placeholders for the skill author. Do not copy it into the presentation folder.

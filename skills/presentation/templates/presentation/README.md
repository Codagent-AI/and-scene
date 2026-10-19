# Presentation template

Copy this folder to `<app-root>/src/presentations/<slug>/` and replace every placeholder below. `README.md` is documentation for the skill author and must not be copied into the presentation folder.

## Placeholders

| Placeholder | Replace with | Default in the bootstrap layout |
|---|---|---|
| `__SLUG__` | the presentation's kebab-case slug; prefixes every entity id in `entities.ts` | (none) |
| `__TITLE__` | the human-readable title shown on the page and in the registry | (none) |
| `__KIT__` | the import specifier from `<app-root>/src/presentations/<slug>/` (the folder of `Talk.tsx` and `Scene.tsx`) to the recorded scene-kit directory | `../../presentation-kit` |
| `__KIT_FROM_STEPS__` | the same kit import specifier, but computed from `<app-root>/src/presentations/<slug>/steps/` | `../../../presentation-kit` |

Both kit placeholders come from the scene-kit location recorded during preflight. If the kit was found somewhere else, compute each specifier relative to the file's own directory. Never hard-code the default when a different location was recorded.

## Registry line

The presentation's registry line goes in the registry module recorded during preflight (conventionally `<app-root>/src/presentations/index.ts`), as one entry of its explicit list. The import specifier in that line is relative to the registry module and points at `<slug>/Talk`; for the conventional layout it is `./<slug>/Talk`:

    { slug: '<slug>', title: '<title>', load: () => import('./<slug>/Talk') },

## Files

- `entities.ts`: the layoutId namespace and entity rects.
- `Scene.tsx`: the scene that reads a step's payload and renders entities.
- `steps/index.ts`: the ordered steps (stable `id`, `era`, `title`, `caption`, `groupKey`, `Scene`, `payload`).
- `Talk.tsx`: the entry that renders `<Presentation>` with the steps.
- `styles.css`: the presentation's own CSS.

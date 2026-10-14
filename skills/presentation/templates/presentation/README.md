# Per-presentation templates

Files ending in `.tmpl` are copied into `src/presentations/<slug>/` (dropping `.tmpl`; `Scene.tsx.tmpl`
becomes `TalkScene.tsx`; `steps/step.tsx.tmpl` is instantiated once per step) with these substitutions:

| Token | Meaning | Example |
| --- | --- | --- |
| `__SLUG__` | route slug and folder name (kebab-case) | `quarterly-review` |
| `__TITLE__` | human title (landing page, header) | `Quarterly Review` |
| `__PREFIX__` | short CSS/layoutId prefix unique to this presentation | `qr` |
| `__N__` / `__I__` | step number (1-based) / outline index (0-based) | `3` / `2` |

The templates are a structural starting point only. Replace the sample scene, replace `talk.css` stub rules with
real presentation styling, and delete anything unused. Never put these files, or any styling, in `src/presentation-kit/`.

# Per-presentation skeleton

Copy this directory to `src/presentations/<slug>/`. Replace every `REPLACE_*` token before building:

- `REPLACE_SLUG`: lowercase route slug and CSS filename.
- `REPLACE_SCENE_NAME`: React scene component name and `steps/REPLACE_SCENE_NAME.tsx` filename.
- `REPLACE_STEP_NAME`: exported step constant name.
- `REPLACE_STEP_ID`: stable step identity.
- `REPLACE_ERA`: section label.
- `REPLACE_TITLE`: one-line presenter title.
- `REPLACE_CAPTION`: browse-mode narration for this step.
- `REPLACE_PRESENTATION_TITLE`: presentation title.

Add one registry entry for the slug. Duplicate `step-01.tsx` for additional beats and export them in `steps/index.ts`. Keep IDs stable for continuing entities, share a scene and `groupKey` for successive states when appropriate, and author all visual treatments in `<slug>.css`. The kit imports in the examples are relative to `src/presentations/<slug>/`.

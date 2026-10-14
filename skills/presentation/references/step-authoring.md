# Step authoring

Each step is `{ id, era, title, caption, Scene, groupKey?, payload? }` (`outline.ts` holds id/era/title/caption as
plain data; `steps/stepN.tsx` adds `Scene`, `groupKey`, `payload`).

- **title**: one-liner shown while presenting. **caption**: 1–2 sentences shown in browse mode.
- One idea per step. Say what *changed* in the scene, not a summary of the whole deck.
- Order the outline as an arc: setup → development → payoff. Keep `id`s stable when reordering.
- In `steps/index.ts` export `STEPS` in presentation order; `Talk.tsx` renders
  `<Presentation steps={STEPS} title={TALK_TITLE} initialMode="browse" />`.
- Add a step: add an outline entry, a `steps/stepN.tsx` (copy `templates/presentation/steps/step.tsx.tmpl`), include it
  in `STEPS`, and extend `TalkScene` for the new `payload.step`.
- Dense steps: keep text short; verify them first in screenshots.

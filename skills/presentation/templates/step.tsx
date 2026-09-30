import type { Step } from '../../presentation-kit'

// Add a typed payload, scene component, and one Step entry to the presentation's steps/index.tsx.
export const step: Step = {
  id: '{{STEP_ID}}',
  era: '{{ERA}}',
  title: '{{TITLE}}',
  caption: '{{CAPTION}}',
  Scene: {{SCENE_COMPONENT}},
  payload: {{PAYLOAD}},
  groupKey: '{{SCENE_GROUP}}',
}

import { Box, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { entities } from '../entities'

export type StepPayload = { detail: string }

export const step: Step<StepPayload> = {
  id: 'step-1',
  era: 'begin',
  title: 'A clear beginning',
  caption: 'Replace this caption with the first beat of the story.',
  groupKey: 'scene',
  payload: { detail: 'Your topic' },
  Scene: ({ payload }) => <SceneLayer><Box entityId={entities.subject}>{payload.detail}</Box><Box entityId={entities.idea}>Add your visual here</Box></SceneLayer>,
}

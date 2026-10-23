import type { Step } from '../../../presentation-kit'
import { topic } from '../entities'
import { Scene } from '../Scene'
import type { ScenePayload } from '../types'

export const entities = [topic]

export const step: Step<ScenePayload> = {
  id: 'start',
  era: 'beginning',
  title: 'Start here',
  caption: 'Replace this step with the first beat of the story.',
  groupKey: 'scene',
  Scene,
  payload: { entities },
}

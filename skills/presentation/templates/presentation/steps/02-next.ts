import type { Step } from '../../../presentation-kit'
import { detail, link } from '../entities'
import { Scene } from '../Scene'
import type { ScenePayload } from '../types'
import { entities as previous } from './01-start'

export const entities = [...previous, link, detail]

export const step: Step<ScenePayload> = {
  id: 'next',
  era: 'beginning',
  title: 'Then this',
  caption: 'Keep earlier entities by id so they stay put; add new ones to extend the scene.',
  groupKey: 'scene',
  Scene,
  payload: { entities },
}

import type { Step } from '../../../presentation-kit'
import { kit, kitPlug } from '../entities'
import { SampleScene } from '../Scene'
import type { SamplePayload } from '../types'
import { entities as previous } from './05-depth'

export const entities = [...previous, kit, kitPlug]

export const step: Step<SamplePayload> = {
  id: 'it-assembles-the-scene',
  era: 'the build',
  title: 'It assembles the scene',
  caption:
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  groupKey: 'scene',
  Scene: SampleScene,
  payload: { entities },
}

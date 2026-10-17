import { defineStep } from '../../../presentation-kit'
import { OUTLINE } from '../outline'
import { SampleScene } from './scene'

/** Nine beats of one evolving scene: they share a group, so the scene never remounts. */
export const STEPS = OUTLINE.map((beat, index) =>
  defineStep({ ...beat, Scene: SampleScene, groupKey: 'scene', payload: { stage: index + 1 } }),
)

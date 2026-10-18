import { defineStep } from '__KIT__'
import { OUTLINE } from '../outline'
import { Scene } from './scene'

/** Beats that share a group keep one scene instance, so persisting entities morph in place. */
export const STEPS = OUTLINE.map((beat, index) =>
  defineStep({ ...beat, Scene, groupKey: 'scene', payload: { stage: index + 1 } }),
)

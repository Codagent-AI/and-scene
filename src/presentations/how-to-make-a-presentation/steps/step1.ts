import type { SampleStep } from '../types'
import { Scene } from '../Scene'

export const step1: SampleStep = {
  id: 'step-1',
  era: "the ask",
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  Scene,
  groupKey: 'sample',
  payload: { step: 1 },
}

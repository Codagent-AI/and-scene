import { ID } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../SampleScene.tsx'
import type { Step } from '../../../presentation-kit/index.ts'
import { STEP_01 } from './01-you-have-a-topic.ts'

export const STEP_02: Step<SamplePayload> = {
  id: "the-skill-interviews-you",
  era: "the ask",
  title: "The skill interviews you",
  caption: "One question at a time: the topic, the look, then each beat of the story.",
  Scene: SampleScene,
  groupKey: 'how-to-scene',
  payload: { visible: [...STEP_01.payload.visible, ID.skill, ID.conversation, ID.question] },
}

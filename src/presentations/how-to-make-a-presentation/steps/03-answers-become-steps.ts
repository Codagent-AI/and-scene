import { ID } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../SampleScene.tsx'
import type { Step } from '../../../presentation-kit/index.ts'
import { STEP_02 } from './02-the-skill-interviews-you.ts'

export const STEP_03: Step<SamplePayload> = {
  id: "answers-become-steps",
  era: "the gathering",
  title: "Answers become steps",
  caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  Scene: SampleScene,
  groupKey: 'how-to-scene',
  payload: { visible: [...STEP_02.payload.visible, ID.tray, ID.card1] },
}

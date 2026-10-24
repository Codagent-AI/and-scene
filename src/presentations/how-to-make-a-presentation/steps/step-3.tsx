import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../entities.ts'
import type { Step } from '../../../presentation-kit/index.ts'
import { step2 } from './step-2.tsx'

export const step3: Step<SamplePayload> = {
  id: 'answers',
  groupKey: 'sample',
  era: 'the gathering',
  title: "Answers become steps",
  caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  Scene: SampleScene,
  payload: { visible: [...step2.payload.visible, 'tray', 'card-1', 'link-1', 'morph-1'] },
}

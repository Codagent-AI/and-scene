import { ID } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../SampleScene.tsx'
import type { Step } from '../../../presentation-kit/index.ts'
import { STEP_06 } from './06-it-assembles-the-scene.ts'

export const STEP_07: Step<SamplePayload> = {
  id: "it-checks-its-own-work",
  era: "the build",
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  Scene: SampleScene,
  groupKey: 'how-to-scene',
  payload: { visible: [...STEP_06.payload.visible, ID.verify, ID.linkGhostVerify, ID.verifyBuild, ID.verifyRender, ID.verifyPass] },
}

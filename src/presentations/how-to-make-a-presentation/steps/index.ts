import type { Step } from '../../../presentation-kit/types'
import type { ScenePayload } from '../Scene'
import { step1 } from './Step1'
import { step2 } from './Step2'
import { step3 } from './Step3'
import { step4 } from './Step4'
import { step5 } from './Step5'
import { step6 } from './Step6'
import { step7 } from './Step7'
import { step8 } from './Step8'
import { step9 } from './Step9'

// The nine canonical steps, in on-screen order — see
// openspec/changes/create-and-scene/specs/presentation-verification/spec.md.
export const STEPS: Step<ScenePayload>[] = [step1, step2, step3, step4, step5, step6, step7, step8, step9]

import type { Step } from '../../../presentation-kit'
import type { SamplePayload } from './SampleScene.tsx'
import { step1 } from './01-topic.ts'
import { step2 } from './02-interview.ts'
import { step3 } from './03-steps.ts'
import { step4 } from './04-grows.ts'
import { step5 } from './05-depth.ts'
import { step6 } from './06-assemble.ts'
import { step7 } from './07-verify.ts'
import { step8 } from './08-loop.ts'
import { step9 } from './09-reveal.ts'

export const STEPS: Step<SamplePayload>[] = [
  step1,
  step2,
  step3,
  step4,
  step5,
  step6,
  step7,
  step8,
  step9,
]

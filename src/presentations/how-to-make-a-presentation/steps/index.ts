import type { Step } from '../../../presentation-kit'
import type { SamplePayload } from '../SampleScene'
import { step as step1 } from './01-topic'
import { step as step2 } from './02-interview'
import { step as step3 } from './03-answers'
import { step as step4 } from './04-deck-grows'
import { step as step5 } from './05-depth'
import { step as step6 } from './06-assemble'
import { step as step7 } from './07-verify'
import { step as step8 } from './08-loop'
import { step as step9 } from './09-reveal'

export const STEPS: Step<SamplePayload>[] = [step1, step2, step3, step4, step5, step6, step7, step8, step9]

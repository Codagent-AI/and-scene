import type { Step } from '../../../presentation-kit'
import type { SamplePayload } from '../types'
import { step as s1 } from './01-ask'
import { step as s2 } from './02-interview'
import { step as s3 } from './03-answers'
import { step as s4 } from './04-deck-grows'
import { step as s5 } from './05-depth'
import { step as s6 } from './06-assemble'
import { step as s7 } from './07-verify'
import { step as s8 } from './08-loop'
import { step as s9 } from './09-reveal'

export const STEPS: Step<SamplePayload>[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9]

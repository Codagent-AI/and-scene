import type { Step } from '../../../presentation-kit'
import type { DeckPayload } from '../types'
import { step01 } from './01-topic'
import { step02 } from './02-interview'
import { step03 } from './03-answers'
import { step04 } from './04-grows'
import { step05 } from './05-depth'
import { step06 } from './06-assemble'
import { step07 } from './07-verify'
import { step08 } from './08-loop'
import { step09 } from './09-reveal'

/** Normative nine-step outline, in order. */
export const STEPS: readonly Step<DeckPayload>[] = [
  step01, step02, step03, step04, step05, step06, step07, step08, step09,
]

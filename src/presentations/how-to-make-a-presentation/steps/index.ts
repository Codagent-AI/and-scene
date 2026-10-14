import { step1 } from './01-you-have-a-topic'
import { step2 } from './02-the-skill-interviews-you'
import { step3 } from './03-answers-become-steps'
import { step4 } from './04-the-deck-grows'
import { step5 } from './05-you-set-the-depth'
import { step6 } from './06-it-assembles-the-scene'
import { step7 } from './07-it-checks-its-own-work'
import { step8 } from './08-changed-your-mind-loop-it'
import { step9 } from './09-youre-looking-at-one'

import type { Step } from '../../../presentation-kit'
import type { TalkPayload } from '../Scene'

/** The nine steps in talk order. Adjacent steps share one scene group. */
export const STEPS: Step<TalkPayload>[] = [
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

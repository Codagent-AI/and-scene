import { step1 } from './01-first-step'

import type { Step } from '../../../presentation-kit'
import type { TalkPayload } from '../Scene'

/** The steps in talk order. Adjacent steps share one scene group. */
export const STEPS: Step<TalkPayload>[] = [step1]

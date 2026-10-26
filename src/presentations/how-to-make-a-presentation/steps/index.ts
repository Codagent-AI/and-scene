import type { Step } from '../../../presentation-kit/types'
import type { BeatPayload } from './Scene'
import { youHaveATopic, skillInterviewsYou } from './ask'
import { answersBecomeSteps, deckGrows } from './gathering'
import { youSetTheDepth } from './depth'
import { assemblesTheScene, checksItsOwnWork } from './build'
import { changedYourMindLoopIt } from './loop'
import { youreLookingAtOne } from './reveal'

/** The nine canonical steps, in order — the single source of truth for both `Talk.tsx` and verification. */
export const STEPS: Step<BeatPayload>[] = [
  youHaveATopic,
  skillInterviewsYou,
  answersBecomeSteps,
  deckGrows,
  youSetTheDepth,
  assemblesTheScene,
  checksItsOwnWork,
  changedYourMindLoopIt,
  youreLookingAtOne,
]

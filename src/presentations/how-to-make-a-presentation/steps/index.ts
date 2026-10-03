import type { Step } from '../../../presentation-kit'
import { answersBecomeSteps } from './03-answers-become-steps'
import { changedYourMindLoopIt } from './08-changed-your-mind-loop-it'
import { itAssemblesTheScene } from './06-it-assembles-the-scene'
import { itChecksItsOwnWork } from './07-it-checks-its-own-work'
import { theDeckGrows } from './04-the-deck-grows'
import { theSkillInterviewsYou } from './02-the-skill-interviews-you'
import { youHaveATopic } from './01-you-have-a-topic'
import { youreLookingAtOne } from './09-youre-looking-at-one'
import { youSetTheDepth } from './05-you-set-the-depth'
import type { ScenePayload } from './scene'

export const STEPS: Step<ScenePayload>[] = [
  youHaveATopic,
  theSkillInterviewsYou,
  answersBecomeSteps,
  theDeckGrows,
  youSetTheDepth,
  itAssemblesTheScene,
  itChecksItsOwnWork,
  changedYourMindLoopIt,
  youreLookingAtOne,
]

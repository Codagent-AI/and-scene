import type { Step } from '../../../presentation-kit'
import type { DiagramState } from '../entities'
import { step as step01 } from './01-you-have-a-topic'
import { step as step02 } from './02-the-skill-interviews-you'
import { step as step03 } from './03-answers-become-steps'
import { step as step04 } from './04-the-deck-grows'
import { step as step05 } from './05-you-set-the-depth'
import { step as step06 } from './06-it-assembles-the-scene'
import { step as step07 } from './07-it-checks-its-own-work'
import { step as step08 } from './08-changed-your-mind'
import { step as step09 } from './09-youre-looking-at-one'

/** The nine steps in presentation order. */
export const STEPS: Step<DiagramState>[] = [
  step01, step02, step03, step04, step05, step06, step07, step08, step09,
]

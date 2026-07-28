import type { Step } from '../../../presentation-kit'
import type { Payload } from './payload'
import { step01 } from './01-the-ask'
import { step02 } from './02-the-interview'
import { step03 } from './03-first-card'
import { step04 } from './04-the-deck-grows'
import { step05 } from './05-you-set-the-depth'
import { step06 } from './06-it-assembles-the-scene'
import { step07 } from './07-it-checks-its-own-work'
import { step08 } from './08-loop-it'
import { step09 } from './09-the-reveal'

export const STEPS: Step<Payload>[] = [
  step01,
  step02,
  step03,
  step04,
  step05,
  step06,
  step07,
  step08,
  step09,
]

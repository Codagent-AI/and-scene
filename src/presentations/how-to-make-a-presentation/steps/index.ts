import type { Step } from '../../../presentation-kit'
import type { DiagramPayload } from '../Diagram'
import { step as s1 } from './01-you-have-a-topic'
import { step as s2 } from './02-the-skill-interviews-you'
import { step as s3 } from './03-answers-become-steps'
import { step as s4 } from './04-the-deck-grows'
import { step as s5 } from './05-you-set-the-depth'
import { step as s6 } from './06-it-assembles-the-scene'
import { step as s7 } from './07-it-checks-its-own-work'
import { step as s8 } from './08-changed-your-mind'
import { step as s9 } from './09-youre-looking-at-one'

export const STEPS: Step<DiagramPayload>[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9]

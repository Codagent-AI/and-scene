import type { Step } from '../../../presentation-kit'
import type { DiagramPayload } from '../Diagram'
import { step as s1 } from './01-idea'
import { step as s2 } from './02-build'
import { step as s3 } from './03-share'

export const STEPS: Step<DiagramPayload>[] = [s1, s2, s3]

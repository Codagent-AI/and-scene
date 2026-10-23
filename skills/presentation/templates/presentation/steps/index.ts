import type { Step } from '../../../presentation-kit'
import type { DiagramState } from '../entities'
import { step as first } from './step'

/** The steps in presentation order. */
export const STEPS: Step<DiagramState>[] = [first]

import type { Step } from '../../../presentation-kit'
import { firstStep } from './first-step'

export type PresentationPayload = { label: string }

export const STEPS: readonly Step<PresentationPayload>[] = [firstStep]

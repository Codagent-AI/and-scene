import type { Step } from '../../../presentation-kit'
import type { DeckPayload } from '../types'
import { step01 } from './01-example'
import { step02 } from './02-example'

export const STEPS: readonly Step<DeckPayload>[] = [step01, step02]

import type { Step } from '../../../presentation-kit'
import type { StoryPayload } from '../Scene'
import { step1 } from './step1'
import { step2 } from './step2'

export const STEPS: readonly Step<StoryPayload>[] = [step1, step2]

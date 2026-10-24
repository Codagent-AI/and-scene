import type { Step } from '../../../presentation-kit/index.ts'
import type { ScenePayload } from '../entities.ts'
import { step1 } from './step-1.tsx'
import { step2 } from './step-2.tsx'

export const STEPS: readonly Step<ScenePayload>[] = [step1, step2]

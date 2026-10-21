import type { Step } from '../../../presentation-kit'
import type { SceneState } from '../Scene'
import { step01 } from './step01'
import { step02 } from './step02'

export const STEPS: Step<SceneState>[] = [step01, step02]

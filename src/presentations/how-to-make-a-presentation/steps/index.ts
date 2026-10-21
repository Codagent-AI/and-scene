import type { Step } from '../../../presentation-kit'
import type { SceneState } from '../Scene'
import { step01 } from './step01'
import { step02 } from './step02'
import { step03 } from './step03'
import { step04 } from './step04'
import { step05 } from './step05'
import { step06 } from './step06'
import { step07 } from './step07'
import { step08 } from './step08'
import { step09 } from './step09'

export const STEPS: Step<SceneState>[] = [step01, step02, step03, step04, step05, step06, step07, step08, step09]

import type { Step } from '../../../presentation-kit'
import type { ScenePayload } from '../types'
import { step as start } from './01-start'
import { step as next } from './02-next'

export const STEPS: Step<ScenePayload>[] = [start, next]

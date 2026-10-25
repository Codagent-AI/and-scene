import type { Step } from '../../../presentation-kit'
import { EvolvingScene } from './Scene'
import type { Payload } from './Scene'
import { metadata } from './metadata'
export const STEPS: readonly Step<Payload>[] = metadata.map((meta, i) => ({ ...meta, groupKey: 'the-making', Scene: EvolvingScene, payload: { beat: i + 1 } }))

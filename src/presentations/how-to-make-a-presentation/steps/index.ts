import type { Step } from '../../../presentation-kit'
import { BEAT_SPECS, buildBeats, type Beat } from './beats'
import { Scene } from './Scene'

export const GROUP_KEY = 'htmp-scene'

const beats = buildBeats()

export const STEPS: Step<Beat>[] = BEAT_SPECS.map((spec, i) => ({
  id: spec.id,
  era: spec.era,
  title: spec.title,
  caption: spec.caption,
  Scene,
  groupKey: GROUP_KEY,
  payload: beats[i]!,
}))

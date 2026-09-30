import { Presentation } from '../../presentation-kit'
import type { BeatPayload } from './steps/Scene'
import { STEPS } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation<BeatPayload> steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
}

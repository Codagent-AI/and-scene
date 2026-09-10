import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS, type SamplePayload } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation<SamplePayload> steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
}

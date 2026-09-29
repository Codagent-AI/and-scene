import { Presentation } from '../../presentation-kit/Presentation.tsx'
import { STEPS } from './steps/index.tsx'
import './style.css'

export default function Talk() {
  return <Presentation title="How to Use This Skill to Make a Presentation" steps={STEPS} initialMode="browse" />
}

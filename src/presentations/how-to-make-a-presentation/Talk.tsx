import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation title="How to Use This Skill to Make a Presentation" steps={STEPS} initialMode="browse" />
}

import { Presentation } from '../../presentation-kit/Presentation'
import { steps } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation steps={steps} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
}

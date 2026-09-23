import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './style.css'

export default function Talk() {
  return <Presentation title="How to Use This Skill to Make a Presentation" steps={steps} initialMode="browse" className="how-to-presentation" />
}

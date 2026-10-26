import { Presentation } from '../../presentation-kit'
import './presentation.css'
import { steps } from './steps'

export default function Talk() {
  return <Presentation className="how-to-make-a-presentation" initialMode="browse" steps={steps} title="How to Use This Skill to Make a Presentation" />
}

import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './presentation.css'

export default function Talk() {
  return <div className="workshop-presentation">
    <Presentation title="How to Use This Skill to Make a Presentation" steps={steps} initialMode="browse" />
  </div>
}

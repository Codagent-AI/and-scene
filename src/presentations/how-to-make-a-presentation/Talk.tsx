import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './presentation.css'
export default function Talk() {
  return <div className="skill-story"><Presentation steps={steps} title="How to Use This Skill to Make a Presentation" initialMode="browse" /></div>
}

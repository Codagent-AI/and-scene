import { Presentation } from '../../presentation-kit/Presentation'
import { steps } from './steps'
import './presentation.css'
export default function Talk() {
  return <div className="skill-presentation"><Presentation steps={steps}
    title="How to Use This Skill to Make a Presentation" initialMode="browse" /></div>
}

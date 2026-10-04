import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'

export default function Talk() {
  return <div className="how-to-make-a-presentation"><Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" /></div>
}

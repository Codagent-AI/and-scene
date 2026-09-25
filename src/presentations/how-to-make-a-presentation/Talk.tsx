import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './style.css'

export default function Talk() {
  return <Presentation steps={steps} title="How to Use This Skill to Make a Presentation" initialMode="browse" className="how-to-presentation" />
}

import { Presentation } from '../../presentation-kit'
import './how-to-make-a-presentation.css'
import { STEPS } from './steps'

export default function Talk() {
  return <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
}

import { Presentation } from '../../presentation-kit'
import { steps } from './steps'

export default function Talk() {
  return <Presentation steps={steps} title="How to Use This Skill to Make a Presentation" initialMode="browse" className="sample-presentation" />
}

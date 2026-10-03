import { Presentation } from '../../presentation-kit'
import { referenceSteps } from './steps'
import './styles.css'

export default function Talk() {
  return <Presentation title="How to Use This Skill to Make a Presentation" steps={referenceSteps} initialMode="browse" className="reference-presentation" />
}

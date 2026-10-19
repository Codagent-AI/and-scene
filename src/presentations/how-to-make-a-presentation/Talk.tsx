import { Presentation } from '../../presentation-kit'
import './style.css'
import { STEPS } from './steps'

export default function Talk() {
  return (
    <Presentation
      className="hmp"
      steps={STEPS}
      title="How to Use This Skill to Make a Presentation"
      initialMode="browse"
    />
  )
}

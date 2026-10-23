import { Presentation } from '../../presentation-kit'
import { SAMPLE_STEPS } from './steps'
import './presentation.css'

export default function Talk() {
  return (
    <Presentation
      steps={SAMPLE_STEPS}
      title="How to Use This Skill to Make a Presentation"
      initialMode="browse"
    />
  )
}

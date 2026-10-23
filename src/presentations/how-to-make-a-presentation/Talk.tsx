import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps/steps.ts'
import './talk.css'

export default function Talk() {
  return (
    <Presentation
      className="how-to"
      steps={STEPS}
      title="How to Use This Skill to Make a Presentation"
      initialMode="browse"
    />
  )
}

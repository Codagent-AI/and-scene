import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps.ts'
import './talk.css'

export default function Talk() {
  return (
    <Presentation
      className="htm"
      steps={STEPS}
      title="How to Use This Skill to Make a Presentation"
      initialMode="browse"
    />
  )
}

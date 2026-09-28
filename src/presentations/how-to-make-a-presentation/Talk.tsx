import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './how-to-make-a-presentation.css'

/** How to Use This Skill to Make a Presentation — a talk about itself. */
export default function Talk() {
  return (
    <Presentation
      steps={STEPS}
      title="How to Use This Skill to Make a Presentation"
      initialMode="browse"
      className="htmap-talk"
    />
  )
}

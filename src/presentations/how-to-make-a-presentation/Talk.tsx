import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './how-to-make-a-presentation.css'

/**
 * How to Use This Skill to Make a Presentation
 *
 * The committed reference sample: a self-referential talk, built by the
 * skill, about building presentations with the skill. Its closing beat
 * reveals that the viewer is looking at an example of the skill's own
 * output.
 */
export default function Talk() {
  return <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
}

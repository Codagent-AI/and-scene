import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './how-to-make-a-presentation.css'

export default function Talk() {
  return (
    <div className="howto-deck">
      <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
    </div>
  )
}

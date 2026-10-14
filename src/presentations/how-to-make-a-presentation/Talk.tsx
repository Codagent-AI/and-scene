import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'

export default function Talk() {
  return (
    <div className="how-to">
      <Presentation
        steps={STEPS}
        title="How to Use This Skill to Make a Presentation"
        initialMode="browse"
      />
    </div>
  )
}

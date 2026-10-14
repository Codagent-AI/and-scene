import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './talk.css'

const TITLE = 'How to Use This Skill to Make a Presentation'

export default function Talk() {
  return (
    <div className="how-to-make-a-presentation">
      <Presentation steps={STEPS} title={TITLE} initialMode="browse" />
    </div>
  )
}

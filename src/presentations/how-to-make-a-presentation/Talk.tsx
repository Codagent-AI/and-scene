import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './talk.css'

export default function Talk() {
  return (
    <div className="htp">
      <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
    </div>
  )
}

import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './styles.css'

export default function Talk() {
  return (
    <Presentation
      className="htmp"
      steps={STEPS}
      title="How to Use This Skill to Make a Presentation"
      initialMode="browse"
    />
  )
}

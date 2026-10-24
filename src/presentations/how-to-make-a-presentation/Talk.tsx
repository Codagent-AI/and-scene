import { Presentation } from '../../presentation-kit'
import { SAMPLE_CANVAS } from './entities'
import { STEPS } from './steps'
import './talk.css'

export default function Talk() {
  return <Presentation className="howto" canvas={SAMPLE_CANVAS} steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
}

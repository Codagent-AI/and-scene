import { Presentation } from '../../presentation-kit/index.ts'
import './talk.css'
import { STEPS } from './steps/index.ts'

export default function Talk() {
  return <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
}

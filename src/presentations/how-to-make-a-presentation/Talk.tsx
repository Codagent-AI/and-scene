import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps/steps.ts'
import './styles.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
}

import { Presentation } from '../../presentation-kit/index.ts'
import { TITLE } from './narration.ts'
import { STEPS } from './steps.ts'
import './talk.css'

export default function Talk() {
  return <Presentation steps={STEPS} title={TITLE} initialMode="browse" />
}

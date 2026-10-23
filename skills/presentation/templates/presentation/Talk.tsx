import { Presentation } from '../../presentation-kit/index.ts'
import { TITLE } from './outline.ts'
import { STEPS } from './steps/index.ts'
import './talk.css'

export default function Talk() {
  return <Presentation steps={STEPS} title={TITLE} initialMode="browse" />
}

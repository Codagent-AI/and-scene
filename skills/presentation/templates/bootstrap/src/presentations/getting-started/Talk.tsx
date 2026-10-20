import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps.ts'
import './talk.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="Presentation title" initialMode="browse" className="talk" />
}

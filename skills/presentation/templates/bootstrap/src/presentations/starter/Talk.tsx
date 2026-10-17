import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps.ts'
import './talk.css'

export default function Talk() {
  return <Presentation className="p-starter" steps={STEPS} title="Starter presentation" initialMode="browse" />
}

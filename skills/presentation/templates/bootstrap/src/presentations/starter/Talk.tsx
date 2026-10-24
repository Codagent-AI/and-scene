import { Presentation } from '../../presentation-kit/index.ts'
import './talk.css'
import { STEPS } from './steps/index.ts'

export default function Talk() {
  return <Presentation steps={STEPS} title="Starter presentation" initialMode="browse" className="p-starter" />
}

import { Presentation } from '../../../src/presentation-kit'
import { STEPS } from './steps'
import './small.css'

export default function Small() {
  return <Presentation steps={STEPS.slice(0, 1)} title="Small fixture" className="small" />
}

import { Presentation } from '../../../src/presentation-kit'
import { STEPS } from './steps'
import './polished.css'

export default function Polished() {
  return <Presentation steps={STEPS} title="Polished fixture" className="polished" />
}

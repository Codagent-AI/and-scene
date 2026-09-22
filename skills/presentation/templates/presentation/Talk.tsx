import { Presentation } from '../../presentation-kit'
import step from './steps/step'
import './presentation.css'

const steps = [step]

export default function Talk() {
  return <Presentation steps={steps} title="Presentation title" initialMode="browse" />
}

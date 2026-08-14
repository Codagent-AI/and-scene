import { Presentation } from '../../presentation-kit'
import { firstStep } from './step'
import './presentation.css'

const steps = [firstStep]

export default function Talk() {
  return <Presentation steps={steps} title="Your presentation title" initialMode="browse" />
}

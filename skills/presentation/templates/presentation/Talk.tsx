import { Presentation } from '../../presentation-kit/Presentation'
import { firstStep, type PresentationPayload } from './steps/first'
import './presentation.css'

const STEPS = [firstStep] as const

export default function Talk() {
  return <Presentation<PresentationPayload> steps={STEPS} title="Replace with presentation title" initialMode="browse" />
}

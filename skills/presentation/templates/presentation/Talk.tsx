import { Presentation } from '../../presentation-kit'
import { step } from './steps/step'
import './presentation.css'

const steps = [step]
export default function Talk() {
  return <Presentation title="Presentation title" steps={steps} initialMode="browse" className="example-presentation" />
}

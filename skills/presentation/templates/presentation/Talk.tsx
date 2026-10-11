import { Presentation } from '../../presentation-kit'
import { step01 } from './steps/01'
import { step02 } from './steps/02'
import './presentation.css'

const steps = [step01, step02]

export default function Talk() {
  return <Presentation steps={steps} title="Presentation title" initialMode="browse" />
}

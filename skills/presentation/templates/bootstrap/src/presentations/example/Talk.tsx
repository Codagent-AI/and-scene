import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps/steps.ts'

export default function Talk() {
  return <Presentation steps={STEPS} title="Example presentation" initialMode="browse" />
}

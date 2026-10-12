import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'

export default function Talk() {
  return <Presentation steps={STEPS} title="Starter presentation" />
}

import { Presentation } from '../../presentation-kit/Presentation'
import { steps } from './steps'
export default function Talk() {
  return <Presentation title="Your presentation" steps={steps} initialMode="browse" />
}

import { Presentation } from '../../presentation-kit'
import { steps } from './steps'

export default function Talk() {
  return <Presentation title="Starter presentation" steps={steps} />
}

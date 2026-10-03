import { Presentation } from '../../presentation-kit'
import { step } from './steps/step-01'

export default function Talk() {
  return <Presentation title="Replace with presentation title" steps={[step]} initialMode="browse" />
}

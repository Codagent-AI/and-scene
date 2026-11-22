import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
export default function Talk() {
  return (
    <Presentation
      steps={STEPS}
      title="Your presentation title"
      initialMode="browse"
    />
  )
}

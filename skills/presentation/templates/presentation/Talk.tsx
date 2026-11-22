import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'

// Import a presentation-owned CSS file here after defining the requested look.
export default function Talk() {
  return <Presentation title="Your presentation" steps={STEPS} initialMode="browse" />
}

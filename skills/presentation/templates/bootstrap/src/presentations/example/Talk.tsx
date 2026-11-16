import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
// Add presentation-owned CSS here after gathering visual direction.
export default function Talk() { return <Presentation steps={STEPS} title="Your presentation" initialMode="browse" /> }

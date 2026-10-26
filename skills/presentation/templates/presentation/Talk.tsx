import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
// Import your presentation-owned CSS here. The shared kit supplies no theme.
export default function Talk() { return <Presentation title="Replace title" steps={STEPS} initialMode="browse" /> }

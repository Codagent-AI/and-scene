import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
// Import presentation-owned CSS here after designing the visual look.
export default function Talk() { return <Presentation title="REPLACE_TITLE" steps={STEPS} initialMode="browse" /> }

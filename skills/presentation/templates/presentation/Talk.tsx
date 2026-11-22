import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
// Add presentation-owned CSS here; the reusable kit supplies no visual defaults.
export default function Talk() { return <Presentation title="Presentation title" steps={STEPS} initialMode="browse" /> }

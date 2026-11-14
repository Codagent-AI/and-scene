import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
// Import your own presentation.css here. The kit supplies no visual defaults.
export default function Talk() { return <Presentation title="Your topic" steps={STEPS} initialMode="browse" /> }

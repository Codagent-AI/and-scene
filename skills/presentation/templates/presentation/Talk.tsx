import { Presentation } from '../../presentation-kit/Presentation'
import { steps } from './steps'
// Import your presentation-owned CSS here. The reusable kit has no visual defaults.
export default function Talk() { return <Presentation steps={steps} title="Your presentation" initialMode="browse" /> }

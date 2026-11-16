import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'
export default function Talk() {
  return <div className="your-slug"><Presentation steps={STEPS} title="Your presentation" initialMode="browse" /></div>
}

import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'
export default function Talk() { return <div className="YOUR-SLUG"><Presentation steps={STEPS} title="Your presentation title" initialMode="browse" /></div> }

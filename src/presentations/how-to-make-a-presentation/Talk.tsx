import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import { title } from './metadata'
import './presentation.css'
export default function Talk() { return <div className="how-to-presentation"><Presentation steps={STEPS} title={title} initialMode="browse" /></div> }

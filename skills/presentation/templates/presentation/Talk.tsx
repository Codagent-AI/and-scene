import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './presentation.css'
export default function Talk() { return <Presentation title="Your presentation" steps={steps} initialMode="browse" /> }

import { Presentation } from '../../presentation-kit'
import { steps } from './steps/step'
import './presentation.css'
export default function Talk() { return <Presentation steps={steps} title="Replace with presentation title" initialMode="browse" /> }

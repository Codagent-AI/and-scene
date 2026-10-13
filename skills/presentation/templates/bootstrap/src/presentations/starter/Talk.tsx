import { Presentation } from '../../presentation-kit'
import { steps } from './steps/steps'
import './talk.css'
export default function Talk() { return <Presentation steps={steps} title="Starter presentation" initialMode="browse" /> }

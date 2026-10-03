import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './style.css'

export default function Talk() { return <Presentation steps={steps} title="Starter presentation" className="starter" /> }

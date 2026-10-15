import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
import './starter.css'
export default function Talk() { return <Presentation steps={STEPS} title="Starter presentation" initialMode="browse" /> }

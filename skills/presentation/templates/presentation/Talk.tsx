import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'
export default function Talk() { return <Presentation steps={STEPS} title="Your title" initialMode="browse" /> }

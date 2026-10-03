import { Presentation } from '../../presentation-kit'
import { REFERENCE_STEPS } from './steps'
import './style.css'
export default function Talk() { return <Presentation steps={REFERENCE_STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" /> }

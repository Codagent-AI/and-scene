import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
import './style.css'
export default function Talk() { return <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" /> }

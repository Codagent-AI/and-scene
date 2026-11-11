import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
import './presentation.css'
export default function Talk() { return <div className="sample-presentation"><Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" /></div> }

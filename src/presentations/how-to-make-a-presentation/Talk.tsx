import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './style.css'
export default function Talk() { return <div className="skill-story"><Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" /></div> }

import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps/Story'
import './presentation.css'
export default function Talk(){return <div className="how-to"><Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse"/></div>}

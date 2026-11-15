import { Presentation } from '../../presentation-kit'
import { SAMPLE_WIDTH, SAMPLE_HEIGHT } from './entities'
import { STEPS } from './steps'
import './style.css'
export default function Talk() { return <div className="skill-story"><Presentation steps={STEPS} width={SAMPLE_WIDTH} height={SAMPLE_HEIGHT} title="How to Use This Skill to Make a Presentation" initialMode="browse" /></div> }

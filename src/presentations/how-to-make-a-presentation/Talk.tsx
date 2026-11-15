import { Presentation } from '../../presentation-kit/Presentation'
import { SAMPLE_CANVAS } from './entities'
import { STEPS } from './steps/Story'
import './presentation.css'
export default function Talk() {
  return <div className="workshop"><Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" width={SAMPLE_CANVAS.width} height={SAMPLE_CANVAS.height} /></div>
}

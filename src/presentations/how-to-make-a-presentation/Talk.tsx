import { Presentation } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'
import { BuildScene } from './steps/BuildScene'
import { outline } from './steps/outline'
import './presentation.css'

const steps: readonly Step<number>[] = outline.map((step, index) => ({
  ...step, groupKey: 'conversation', Scene: BuildScene, payload: index + 1,
}))

export default function Talk() {
  return <div className="making-a-presentation">
    <Presentation title="How to Use This Skill to Make a Presentation" steps={steps} initialMode="browse" />
  </div>
}

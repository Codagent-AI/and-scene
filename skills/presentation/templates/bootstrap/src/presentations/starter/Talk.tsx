import { Presentation } from '../../presentation-kit/Presentation'
import type { Step } from '../../presentation-kit/types'
function Scene() { return <div>Start your scene</div> }
const steps: Step[] = [{ id: 'start', era: 'begin', title: 'Start', caption: 'A presentation begins here.', Scene, payload: undefined }]
export default function Talk() { return <Presentation title="Starter" steps={steps} /> }

import { Presentation } from '../../presentation-kit/Presentation'
import type { Step, SceneProps } from '../../presentation-kit/types'
function Scene({payload}:SceneProps<string>) { return <div>{payload}</div> }
const steps: Step<string>[] = [{id:'start',era:'start',title:'Starter',caption:'Replace this starter with your presentation.',Scene,payload:'Your scene here'}]
export default function Talk() { return <Presentation title="Starter" steps={steps}/> }

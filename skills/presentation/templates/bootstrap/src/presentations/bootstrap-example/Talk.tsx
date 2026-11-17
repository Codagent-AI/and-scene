import { Presentation, Box, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function Scene({payload}: SceneProps<string>) { return <SceneLayer><Box id="bootstrap-example:idea">{payload}</Box></SceneLayer> }
const steps: Step<string>[] = [{id:'begin',era:'the idea',title:'A scene begins',caption:'Give an idea a stable identity, then let the story evolve.',Scene,payload:'Your idea',groupKey:'idea'}]
export default function Talk() { return <Presentation title="A scene begins" steps={steps}/> }

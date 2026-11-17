import { Box, Presentation, type SceneProps, type Step } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <Box id="example">{payload}</Box> }
const steps: Step<string>[] = [
 { id:'one', era:'example', title:'First step', caption:'An example scene.', Scene, payload:'First', groupKey:'example' },
 { id:'two', era:'example', title:'Second step', caption:'The scene changes.', Scene, payload:'Second', groupKey:'example' },
]
export default function Talk() { return <Presentation steps={steps} title="Example" /> }

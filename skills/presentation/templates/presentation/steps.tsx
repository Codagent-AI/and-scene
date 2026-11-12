import type { Step, SceneProps } from '../../presentation-kit/types'
import { Box } from '../../presentation-kit/nodes/Box'
import { entities } from './entities'
function Scene({payload}: SceneProps<{label:string}>) { return <Box id={entities.subject} style={{position:'absolute',left:300,top:150}}>{payload.label}</Box> }
export const STEPS: Step<{label:string}>[] = [{id:'start',era:'introduction',title:'YOUR_TITLE',caption:'YOUR_CAPTION',groupKey:'story',Scene,payload:{label:'YOUR_TOPIC'}}]

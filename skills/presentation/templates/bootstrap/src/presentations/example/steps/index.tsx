import type { Step, SceneProps } from '../../../presentation-kit/types'
import { Box } from '../../../presentation-kit/nodes/Box'
import { entities } from '../entities'
function Scene({payload}: SceneProps<{label:string}>) { return <Box id={entities.subject} style={{left:300,top:150}}>{payload.label}</Box> }
export const STEPS: Step<{label:string}>[] = [{id:'start',era:'introduction',title:'Example presentation',caption:'Replace this example with your own evolving scene.',groupKey:'example',Scene,payload:{label:'Your topic'}}]

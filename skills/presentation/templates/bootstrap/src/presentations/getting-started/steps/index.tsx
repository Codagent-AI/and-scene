import { Box } from '../../../presentation-kit/nodes/Box'
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { entities } from '../entities'
function Scene({payload}:SceneProps<{label:string}>) { return <Box id={entities.idea} style={{left:100,top:100}}>{payload.label}</Box> }
export const STEPS: Step<{label:string}>[] = [
 { id:'opening',era:'the idea',title:'Your opening',caption:'Explain the opening idea.',groupKey:'idea',Scene,payload:{label:'An idea'} },
 { id:'change',era:'the idea',title:'What changes',caption:'Explain what changes in this same scene.',groupKey:'idea',Scene,payload:{label:'An idea, developed'} },
]

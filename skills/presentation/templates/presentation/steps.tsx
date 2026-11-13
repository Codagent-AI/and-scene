import type { Step, SceneProps } from '../../presentation-kit/types'
import { Box } from '../../presentation-kit/nodes/Box'
import { entities } from './entities'
function Scene({payload}:SceneProps<{label:string}>){return <Box id={entities.idea}>{payload.label}</Box>}
export const STEPS:Step<{label:string}>[]=[{id:'start',era:'the idea',title:'Your idea',caption:'Explain the first beat here.',Scene,groupKey:'idea',payload:{label:'An idea'}}]

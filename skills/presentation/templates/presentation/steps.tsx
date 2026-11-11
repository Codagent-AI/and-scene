import { Box } from '../../presentation-kit/nodes/Box'
import type { Step, SceneProps } from '../../presentation-kit/types'
import { entities } from './entities'
interface Payload { label: string }
function Scene({ payload }: SceneProps<Payload>) {
  return <Box id={entities.subject} style={{ position: 'absolute', left: 80, top: 80 }}>{payload.label}</Box>
}
export const steps: Step<Payload>[] = [{
  id: 'start', era: 'opening', title: 'Your first beat', caption: 'Explain what changes here.',
  Scene, groupKey: 'main', payload: { label: 'Your subject' },
}]

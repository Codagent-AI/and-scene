import type { Step, SceneProps } from '../../../presentation-kit/types'
import { Box } from '../../../presentation-kit/nodes/Box'
import { entities } from '../entities'
type Payload = { label: string; left: number }
function Story({ payload }: SceneProps<Payload>) {
  return <Box id={entities.idea} style={{ position: 'absolute', left: payload.left, top: 120 }}>{payload.label}</Box>
}
export const STEPS: Step<Payload>[] = [
  { id: 'idea', era: 'the beginning', title: 'An idea', caption: 'Introduce the topic here.', groupKey: 'story', Scene: Story, payload: { label: 'An idea', left: 100 } },
  { id: 'develop', era: 'the development', title: 'An idea develops', caption: 'Explain what changes and why.', groupKey: 'story', Scene: Story, payload: { label: 'A developed idea', left: 420 } },
]

import type { Step, SceneProps } from '../../../presentation-kit'
import { Box, Label, SceneLayer } from '../../../presentation-kit'
import { ENTITY } from '../entities'

type Payload = { text: string }
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer>
    <Box id={ENTITY.subject} className="example-node"><Label id={`${ENTITY.subject}:label`}>{payload.text}</Label></Box>
  </SceneLayer>
}
export const step: Step<Payload> = {
  id: 'step-01', era: 'beginning', title: 'A clear title', caption: 'A concise explanation of this beat.',
  Scene, payload: { text: 'Describe the visual' },
}

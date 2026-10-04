/* eslint-disable react-refresh/only-export-components */
import type { Step, SceneProps } from '../types'
import { Box, Label, SceneLayer } from '../../../presentation-kit'

interface Payload { message: string }

function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer>
    <Box id="example" x={250} y={130} width={380} height={120}>
      <Label x={20} y={30}>{payload.message}</Label>
    </Box>
  </SceneLayer>
}

export const step: Step<Payload> = {
  id: 'introduction', section: 'Introduction', title: 'A clear point',
  caption: 'Explain the idea in one sentence.', Scene, payload: { message: 'Your core idea' },
}

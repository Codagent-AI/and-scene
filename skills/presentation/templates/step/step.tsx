/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../../presentation-kit'
import { Box, Label, SceneLayer } from '../../../presentation-kit'
import { ENTITY } from '../entities'

type Payload = { message: string }
function Scene({ payload }: { payload: Payload }) {
  return <SceneLayer className="presentation-scene-content">
    {/* Keep IDs stable for concepts that continue from adjacent steps. */}
    <Box id={ENTITY.topic} className="presentation-topic" style={{ position: 'absolute', left: 300, top: 110 }}>
      <Label>{payload.message}</Label>
    </Box>
  </SceneLayer>
}

export const step: Step<Payload> = {
  id: 'replace-with-stable-step-id',
  era: 'replace-with-section',
  title: 'Replace with the step title',
  caption: 'Replace with the narration and transition intent.',
  groupKey: 'main-scene',
  Scene,
  payload: { message: 'Describe what is visible at this point.' },
}

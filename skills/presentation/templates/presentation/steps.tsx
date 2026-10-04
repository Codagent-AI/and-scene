/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../presentation-kit'
import { Box, Label, SceneLayer } from '../../presentation-kit'
import { ENTITY } from './entities'

type Content = { message: string }
function Scene({ payload }: { payload: Content }) {
  return <SceneLayer className="example-scene">
    <Box id={ENTITY.topic} className="example-topic" style={{ position: 'absolute', left: 300, top: 110, width: 280, padding: 24 }}>
      <Label>{payload.message}</Label>
    </Box>
  </SceneLayer>
}

// Add a Step entry for each narrative beat. Reuse groupKey and entity IDs when
// the diagram should evolve continuously between adjacent steps.
export const STEPS: Step<Content>[] = [
  { id: 'opening', era: 'Opening', title: 'Replace with a clear point', caption: 'Replace with a concise narration for this step.', groupKey: 'main-scene', Scene, payload: { message: 'Replace with the opening visual' } },
]

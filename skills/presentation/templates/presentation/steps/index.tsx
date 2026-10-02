import type { Step } from '../../../presentation-kit'
import { Box, Label, SceneLayer } from '../../../presentation-kit'
import { ENTITY } from '../entities'

// eslint-disable-next-line react-refresh/only-export-components
function OpeningScene() {
  return <SceneLayer className="example-scene">
    <Box id={ENTITY.subject} className="example-subject" x={300} y={120} width={280} height={100}>Your first idea</Box>
    <Label className="example-label" x={330} y={245}>A visual scene, evolving over time</Label>
  </SceneLayer>
}

export const STEPS: readonly Step[] = [
  { id: 'opening', era: 'Begin', title: 'Start with an idea', caption: 'Introduce the central idea and show where the story begins.', Scene: OpeningScene, payload: undefined },
]

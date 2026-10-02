import type { Step } from '../../../presentation-kit'
import { Box, SceneLayer } from '../../../presentation-kit'

// Replace the example content and keep IDs stable between scenes for morphs.
// eslint-disable-next-line react-refresh/only-export-components
function ExampleScene() {
  return <SceneLayer className="my-step-scene">
    <Box id="stable-entity-id" className="my-step-node" x={320} y={130} width={240} height={90}>Step idea</Box>
  </SceneLayer>
}

export const step: Step = {
  id: 'step-id', era: 'Era', title: 'Step title', caption: 'What this step explains.',
  Scene: ExampleScene, payload: undefined,
}

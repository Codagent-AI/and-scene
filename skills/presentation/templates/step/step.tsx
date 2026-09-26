import type { Step } from '../../../presentation-kit'
import { Box, Label, SceneLayer } from '../../../presentation-kit'

function Scene() {
  return <SceneLayer className="scene-layer">
    <Box id="example:topic" className="topic-box"><Label className="topic-label">Your topic</Label></Box>
  </SceneLayer>
}

export const step: Step<null> = {
  id: 'opening',
  era: 'Opening',
  title: 'A clear one-line idea',
  caption: 'A short browse-mode explanation of this beat.',
  scene: Scene,
  payload: null,
}

import { Box, Label, SceneLayer } from '../../../presentation-kit'

export default function Scene() {
  return <SceneLayer className="scene-layer">
    <Box id="example:topic" className="topic-box"><Label id="example:topic-label" className="topic-label">Your topic</Label></Box>
  </SceneLayer>
}

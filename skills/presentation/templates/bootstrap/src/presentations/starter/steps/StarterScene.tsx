import { Box, Label, SceneLayer } from '../../../presentation-kit/nodes'
import type { SceneProps } from '../../../presentation-kit/types'
export default function StarterScene({ step }: SceneProps) {
  return <SceneLayer id="starter:layer"><Box id="starter:example" style={{ position: 'absolute', left: 300, top: 120, width: 280, height: 100 }}><Label id="starter:label">{step.title}</Label></Box></SceneLayer>
}

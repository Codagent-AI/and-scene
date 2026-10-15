import { Box, Label, SceneLayer } from '../../../presentation-kit/nodes'
import type { SceneProps } from '../../../presentation-kit/types'
import { ENTITY_IDS } from '../entities'
export default function REPLACE_SCENE_NAME({ step }: SceneProps) {
  return <SceneLayer id="REPLACE_SLUG:layer"><Box id={ENTITY_IDS.example} style={{ position: 'absolute', left: 300, top: 120, width: 280, height: 100 }}><Label id="REPLACE_SLUG:label">{step.title}</Label></Box></SceneLayer>
}

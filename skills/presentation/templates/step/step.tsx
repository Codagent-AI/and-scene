import type { Step } from '../../../presentation-kit/types'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { Box } from '../../../presentation-kit/nodes/Box'

export const step: Step = {
  id: '{{STEP_ID}}',
  era: '{{STEP_ERA}}',
  title: '{{STEP_TITLE}}',
  caption: '{{STEP_CAPTION}}',
  payload: null,
  scene: () => <SceneLayer className="{{SLUG}}__scene">
    <Box id="{{ENTITY_ID}}" className="{{SLUG}}__box">{{ENTITY_LABEL}}</Box>
  </SceneLayer>,
}

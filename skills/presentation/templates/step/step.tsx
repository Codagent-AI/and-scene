import type { Step } from '../../../presentation-kit/types'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { Box } from '../../../presentation-kit/nodes/Box'

export const step: Step = {
  title: '{{STEP_TITLE}}',
  caption: '{{STEP_CAPTION}}',
  Scene: () => <SceneLayer className="{{SLUG}}__scene">
    <Box id="{{ENTITY_ID}}" className="{{SLUG}}__box">{{ENTITY_LABEL}}</Box>
  </SceneLayer>,
}

import { Label } from '../../../presentation-kit/nodes/Label'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { Step } from '../../../presentation-kit/types'

function Scene() {
  return <SceneLayer>
    <Label id="example" style={{ position: 'absolute', left: 80, top: 80 }}>Replace this scene with the first visual beat.</Label>
  </SceneLayer>
}

export const step: Step = {
  id: 'step-01',
  era: 'Introduction',
  title: 'A clear step title',
  caption: 'A concise sentence explaining this step.',
  Scene,
  payload: undefined,
}

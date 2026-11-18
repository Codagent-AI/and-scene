import type { SceneProps, Step } from '../../../presentation-kit/types'
import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { entityId } from '../entities'
interface Payload { label: string }
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box identity={entityId('idea')} style={{ position: 'absolute', left: 320, top: 150 }}>{payload.label}</Box></SceneLayer>
}
export const STEPS: Step<Payload>[] = [{ id: 'idea', era: 'begin', title: 'REPLACE_TITLE', caption: 'REPLACE_CAPTION', Scene, groupKey: 'story', payload: { label: 'REPLACE_LABEL' } }]

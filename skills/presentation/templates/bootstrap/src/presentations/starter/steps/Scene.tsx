import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { SceneProps } from '../../../presentation-kit/types'

type Payload = { message: string }
export function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer className="starter-scene"><Box id="starter:message" className="starter-card">{payload.message}</Box></SceneLayer>
}

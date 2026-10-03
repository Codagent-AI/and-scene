import type { SceneProps } from '../../presentation-kit/types'
import { SceneLayer } from '../../presentation-kit/nodes/SceneLayer'
import { Box } from '../../presentation-kit/nodes/Box'

type Payload = Record<string, never>
export function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer className="presentation-scene">{/* Compose stable kit entities from payload. */}<Box id="presentation:stable-entity">{String(payload)}</Box></SceneLayer>
}

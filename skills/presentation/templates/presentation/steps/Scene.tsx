import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { SceneProps } from '../../../presentation-kit/types'
import { ENTITY } from '../entities'

type Payload = { message: string }
export function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer className="{{SLUG}}-scene"><Box id={ENTITY.example} className="{{SLUG}}-entity">{payload.message}</Box></SceneLayer>
}

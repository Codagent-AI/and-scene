import { Box, Label, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { entity } from './entities'

export type Payload = { message: string }
export function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer id="overview"><Box id={entity('idea')} className="idea"><Label id={entity('message')}>{payload.message}</Label></Box></SceneLayer>
}

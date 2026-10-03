import { Box, SceneLayer } from '../../presentation-kit'
import { ENTITY } from './entities'

export interface Payload { label: string }

export function Scene({ payload }: { payload: Payload }) {
  return <SceneLayer className="scene-example"><Box id={ENTITY.example} className="scene-example__box">{payload.label}</Box></SceneLayer>
}

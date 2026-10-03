import { Box, SceneLayer } from '../../../../presentation-kit'
import { ENTITY } from '../../entities'

export interface StepPayload {
  // Add only the content this scene needs to render.
  label: string
}

export function StepScene({ payload }: { payload: StepPayload }) {
  return <SceneLayer className="scene-step"><Box id={ENTITY.example} className="scene-step__entity">{payload.label}</Box></SceneLayer>
}

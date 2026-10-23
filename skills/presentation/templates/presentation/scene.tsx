import { Fragment } from 'react'
import { Arrow, Box, SceneLayer, type SceneProps } from '../../presentation-kit'
import { E, type EntityId } from './entities'

export interface ScenePayload {
  /** Entities on screen for this step. Entities accumulate; they are not redrawn. */
  visible: readonly EntityId[]
  /** Entities introduced by this step: only these fade in. Continuing entities just morph. */
  entering: readonly EntityId[]
}

function render(id: EntityId, appear: boolean) {
  switch (id) {
    case E.idea:
      return <Box id={id} appear={appear} x={80} y={140} width={200} height={90}><span>idea</span></Box>
    case E.detail:
      return <Box id={id} appear={appear} x={600} y={140} width={200} height={90}><span>detail</span></Box>
    case E.link:
      return <Arrow id={id} appear={appear} from={{ x: 290, y: 185 }} to={{ x: 590, y: 185 }} />
  }
}

export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      {payload.visible.map((id) => (
        <Fragment key={id}>{render(id, payload.entering.includes(id))}</Fragment>
      ))}
    </SceneLayer>
  )
}

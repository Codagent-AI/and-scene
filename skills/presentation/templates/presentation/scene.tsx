import { Appear, Arrow, Box, SceneLayer, type SceneProps } from '../../presentation-kit'
import { E, type EntityId } from './entities'

export interface ScenePayload {
  /** Entities on screen for this step. Entities accumulate; they are not redrawn. */
  visible: readonly EntityId[]
}

function render(id: EntityId) {
  switch (id) {
    case E.idea:
      return <Box id={id} x={80} y={140} width={200} height={90}><span>idea</span></Box>
    case E.detail:
      return <Box id={id} x={600} y={140} width={200} height={90}><span>detail</span></Box>
    case E.link:
      return <Arrow id={id} from={{ x: 290, y: 185 }} to={{ x: 590, y: 185 }} />
  }
}

export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      {payload.visible.map((id) => (
        <Appear key={id}>{render(id)}</Appear>
      ))}
    </SceneLayer>
  )
}

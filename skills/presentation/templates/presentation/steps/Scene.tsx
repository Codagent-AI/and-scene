import { Arrow, Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { E } from '../entities'

export interface ScenePayload {
  /** Zero-based index of the active step. */
  step: number
}

/** One scene for every step: add entities as the story grows instead of redrawing. */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      <Box key={E.idea} id={E.idea} x={80} y={140} width={200} height={80}>
        <span>idea</span>
      </Box>
      {payload.step >= 1 && (
        <Arrow key={E.link} id={E.link} from={{ x: 280, y: 180 }} to={{ x: 560, y: 180 }} />
      )}
      {payload.step >= 1 && (
        <Box key={E.detail} id={E.detail} x={560} y={140} width={240} height={80}>
          <span>detail</span>
        </Box>
      )}
    </SceneLayer>
  )
}

import { Arrow, Box, SceneLayer, type SceneProps } from '../../presentation-kit'
import { ENTITY, RECT } from './entities'

export interface SceneState {
  /** 1-based beat; entities from earlier beats stay on screen. */
  step: number
}

/**
 * One persistent Scene for the whole presentation. The payload's beat decides which
 * entities are on screen, so entities from earlier beats keep their place.
 */
export function PresentationScene({ payload }: SceneProps<SceneState>) {
  const n = payload.step
  return (
    <SceneLayer>
      <Box key={ENTITY.source} entity={ENTITY.source} appear style={RECT.source}>
        source
      </Box>
      {n >= 2 && (
        <Box key={ENTITY.target} entity={ENTITY.target} appear style={RECT.target}>
          target
        </Box>
      )}
      {n >= 2 && (
        <Arrow
          key={ENTITY.link}
          entity={ENTITY.link}
          appear
          from={{ x: RECT.source.left + RECT.source.width + 4, y: 180 }}
          to={{ x: RECT.target.left - 4, y: 180 }}
        />
      )}
    </SceneLayer>
  )
}

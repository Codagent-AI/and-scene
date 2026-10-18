import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { ENTITY } from '../entities'

export interface SceneState {
  /** One-based step whose diagram state is shown. */
  step: number
}

/**
 * One persistent scene. `subject` continues through every step and morphs in place;
 * `detail` is a newcomer from step 2, so it alone carries `appear`.
 */
export function Scene({ payload }: SceneProps<SceneState>) {
  return (
    <SceneLayer>
      <Box
        key={ENTITY.subject}
        id={ENTITY.subject}
        className="subject"
        at={payload.step === 1 ? { x: 340, y: 140, w: 200, h: 100 } : { x: 120, y: 140, w: 200, h: 100 }}
      >
        Subject
      </Box>
      {payload.step >= 2 ? (
        <Box key={ENTITY.detail} id={ENTITY.detail} className="detail" appear at={{ x: 440, y: 140, w: 200, h: 100 }}>
          Detail
        </Box>
      ) : null}
    </SceneLayer>
  )
}

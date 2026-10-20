import { Appear } from '../../presentation-kit/nodes/Appear.tsx'
import { Box } from '../../presentation-kit/nodes/Box.tsx'
import { SceneLayer } from '../../presentation-kit/nodes/SceneLayer.tsx'
import type { SceneProps } from '../../presentation-kit/types.ts'
import { ids } from './entities.ts'

export interface ScenePayload {
  /** 1-based step shown. */
  step: number
}

const at = (x: number, y: number, width: number, height: number) => ({
  position: 'absolute' as const,
  left: x,
  top: y,
  width,
  height,
})

/** One evolving scene on the 880 x 380 canvas. Newcomers are wrapped in Appear; continuing entities are not re-wrapped. */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      <Appear key={ids.topic} style={at(40, 40, 200, 80)}>
        <Box layoutId={ids.topic} style={{ width: '100%', height: '100%' }}>
          topic
        </Box>
      </Appear>
      {payload.step >= 2 ? (
        <Appear key={ids.idea} style={at(320, 40, 200, 80)}>
          <Box layoutId={ids.idea} style={{ width: '100%', height: '100%' }}>
            idea
          </Box>
        </Appear>
      ) : null}
    </SceneLayer>
  )
}

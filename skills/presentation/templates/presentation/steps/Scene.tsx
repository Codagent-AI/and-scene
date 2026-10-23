import { Appear, Box, SceneLayer, type SceneProps } from '../../../presentation-kit/index.ts'
import { ENTITIES } from '../entities.ts'

export interface ScenePayload {
  /** 1-based step; the scene shows every entity introduced up to it. */
  stage: number
}

export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      {ENTITIES.filter((e) => e.stage <= payload.stage).map((e) => (
        <Appear key={e.id}>
          <Box layoutId={e.id} rect={e.rect}>
            {e.text}
          </Box>
        </Appear>
      ))}
    </SceneLayer>
  )
}

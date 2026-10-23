import { Appear, Box, SceneLayer, type SceneProps } from '../../../presentation-kit/index.ts'

export interface ScenePayload {
  /** 1-based step; the scene shows everything introduced up to it. */
  stage: number
}

/** One evolving scene: step 2 adds a box and keeps the first where it is. */
export function Scene({ payload, previous }: SceneProps<ScenePayload>) {
  const seen = previous?.stage ?? 0
  return (
    <SceneLayer>
      <Appear key="first" enter={seen < 1}>
        <Box layoutId="starter-first" rect={{ x: 80, y: 120, w: 260, h: 120 }}>
          First idea
        </Box>
      </Appear>
      {payload.stage >= 2 ? (
        <Appear key="second" enter={seen < 2}>
          <Box layoutId="starter-second" rect={{ x: 540, y: 120, w: 260, h: 120 }}>
            Second idea
          </Box>
        </Appear>
      ) : null}
    </SceneLayer>
  )
}

import { Appear, Arrow, Box, SceneLayer, type SceneProps } from '../../presentation-kit'

export interface StarterPayload {
  /** 1-based step number whose entities are on screen. */
  step: number
}

/** One persistent scene; entities accumulate as the payload step grows. */
export function StarterScene({ payload }: SceneProps<StarterPayload>) {
  return (
    <SceneLayer>
      {payload.step >= 1 && (
        <Appear key="idea">
          <Box id="idea" x={60} y={150} w={200} h={80}>an idea</Box>
        </Appear>
      )}
      {payload.step >= 2 && (
        <Appear key="scene">
          <Box id="scene" x={620} y={150} w={200} h={80}>one scene</Box>
        </Appear>
      )}
      {payload.step >= 2 && (
        <Appear key="link">
          <Arrow id="link" from={[264, 190]} to={[616, 190]} />
        </Appear>
      )}
      {payload.step >= 3 && (
        <Appear key="steps">
          <Box id="steps" x={340} y={290} w={200} h={60}>many steps</Box>
        </Appear>
      )}
    </SceneLayer>
  )
}

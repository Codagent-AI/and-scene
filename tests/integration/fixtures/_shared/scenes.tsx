import { Box, Label, SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'

export interface Beat {
  beat: number
}

/** Two well-separated boxes; the second step adds a third without touching the others. */
export function Plain({ payload }: SceneProps<Beat>) {
  return (
    <SceneLayer>
      <Box id="plain-a" style={{ left: 60, top: 60, width: 200, height: 60 }}>
        alpha
      </Box>
      <Box id="plain-b" style={{ left: 560, top: 60, width: 200, height: 60 }}>
        beta
      </Box>
      {payload.beat >= 2 ? (
        <Box id="plain-c" style={{ left: 300, top: 250, width: 240, height: 60 }}>
          gamma
        </Box>
      ) : null}
    </SceneLayer>
  )
}

/** Two labels stacked on the same spot from step 2 on. */
export function Stacked({ payload, wrap }: SceneProps<Beat> & { wrap?: boolean }) {
  const labels = (
    <>
      <Label id="stack-a" style={{ left: 200, top: 150 }}>
        first stacked words
      </Label>
      <Label id="stack-b" style={{ left: 210, top: 155 }}>
        second stacked words
      </Label>
    </>
  )
  return <SceneLayer>{payload.beat >= 2 ? (wrap ? <div data-presentation-allow-overlap="">{labels}</div> : labels) : null}</SceneLayer>
}

export const AllowedStack = (props: SceneProps<Beat>) => <Stacked {...props} wrap />

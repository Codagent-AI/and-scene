import { Box, Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'

interface Payload {
  second: boolean
}

function StarterScene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Box key="a" id="starter-a" at={{ x: 60, y: 120, w: 200, h: 80 }}>
        start
      </Box>
      {payload.second ? (
        <Label key="b" id="starter-b" at={{ x: 360, y: 150, w: 300, h: 40 }}>
          the scene evolves
        </Label>
      ) : null}
    </SceneLayer>
  )
}

const STEPS: Step<Payload>[] = [
  { id: 'start', era: 'start', title: 'Start', caption: 'One entity on the canvas.', groupKey: 'scene', Scene: StarterScene, payload: { second: false } },
  { id: 'evolve', era: 'start', title: 'Evolve', caption: 'A second entity joins; the first stays put.', groupKey: 'scene', Scene: StarterScene, payload: { second: true } },
]

export default function Talk() {
  return <Presentation steps={STEPS} title="Starter" />
}

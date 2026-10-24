import { Appear, Label, SceneLayer, type SceneProps } from '../../../src/presentation-kit'

export interface FixturePayload {
  step: number
}

/** Step 1 is clean, step 2 has an unmarked text collision, step 3 an allowed readable overlap. */
export function FixtureScene({ payload }: SceneProps<FixturePayload>) {
  return (
    <SceneLayer>
      <Appear key="clean">
        <Label id="clean" x={40} y={40} w={200} h={24}>clean label</Label>
      </Appear>
      {payload.step === 2 && (
        <Appear key="collision">
          <Label id="collide-a" x={300} y={160} w={220} h={24}>collision alpha</Label>
          <Label id="collide-b" x={310} y={166} w={220} h={24}>collision beta</Label>
        </Appear>
      )}
      {payload.step === 3 && (
        <Appear key="allowed">
          <div data-presentation-allow-overlap="" style={{ position: 'absolute', inset: 0 }}>
            <Label id="stack-a" x={300} y={160} w={220} h={24}>stacked alpha</Label>
            <Label id="stack-b" x={310} y={166} w={220} h={24}>stacked beta</Label>
          </div>
        </Appear>
      )}
    </SceneLayer>
  )
}

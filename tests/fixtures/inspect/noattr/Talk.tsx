import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'

function Scene({ payload }: SceneProps<{ n: number }>) {
  return (
    <SceneLayer>
      <Label key={payload.n} id="n:l" at={{ x: 100, y: 100, w: 300, h: 30 }}>{`No attribution ${payload.n}`}</Label>
    </SceneLayer>
  )
}

const STEPS: Step<{ n: number }>[] = [1, 2].map((n) => ({ id: `s${n}`, era: 'only', title: `No attribution ${n}`, caption: `Caption ${n}`, Scene, groupKey: 'n', payload: { n } }))

export default function Talk() {
  return <Presentation steps={STEPS} title="No attribution" attribution={false} />
}

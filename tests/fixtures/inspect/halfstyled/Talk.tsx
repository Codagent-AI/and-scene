import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './styles.css'

function Scene({ payload }: SceneProps<{ n: number }>) {
  return (
    <SceneLayer>
      <Label key={payload.n} id="hs:l" at={{ x: 100, y: 100, w: 300, h: 30 }}>{`Half styled ${payload.n}`}</Label>
    </SceneLayer>
  )
}

const STEPS: Step<{ n: number }>[] = [1, 2].map((n) => ({ id: `s${n}`, era: 'only', title: `Half ${n}`, caption: `Caption ${n}`, Scene, groupKey: 'hs', payload: { n } }))

export default function Talk() {
  return <Presentation className="halfstyled" steps={STEPS} title="Half styled" />
}

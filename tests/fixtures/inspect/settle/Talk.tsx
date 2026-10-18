import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './styles.css'

function Scene({ payload }: SceneProps<{ n: number }>) {
  return (
    <SceneLayer>
      <Label key={payload.n} id="s:l" at={{ x: 100, y: 100, w: 300, h: 30 }}>{`Settle ${payload.n}`}</Label>
    </SceneLayer>
  )
}

const STEPS: Step<{ n: number }>[] = [1, 2].map((n) => ({ id: `s${n}`, era: 'only', title: `Settle ${n}`, caption: `Caption ${n}`, Scene, groupKey: 's', payload: { n } }))

export default function Talk() {
  return <Presentation className="settle" steps={STEPS} title="Settle" />
}

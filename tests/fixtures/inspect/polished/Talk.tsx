import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './styles.css'

interface P {
  n: number
}

function Scene({ payload }: SceneProps<P>) {
  return (
    <SceneLayer>
      <Label key={payload.n} id="p:l" at={{ x: 100, y: 100, w: 300, h: 30 }}>
        {`Polished step ${payload.n}`}
      </Label>
    </SceneLayer>
  )
}

const STEPS: Step<P>[] = [1, 2, 3, 4].map((n) => ({ id: `s${n}`, era: n <= 2 ? 'first' : 'second', title: `Polished ${n}`, caption: `Caption ${n}`, Scene, groupKey: 'p', payload: { n } }))

export default function Talk() {
  return <Presentation className="polished" steps={STEPS} title="Polished" />
}

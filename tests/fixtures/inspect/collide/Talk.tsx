import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'

interface P {
  n: number
}

// Step 1: unmarked collision. Step 2: the same readable overlap, explicitly allowed.
// Step 3: the allowed overlap plus a separate unmarked collision. Step 4: clean.
function Scene({ payload }: SceneProps<P>) {
  const n = payload.n
  return (
    <SceneLayer>
      {n === 1 && <Label key="a" id="c:a" at={{ x: 100, y: 100, w: 200, h: 30 }}>Alpha overlap</Label>}
      {n === 1 && <Label key="b" id="c:b" at={{ x: 110, y: 105, w: 200, h: 30 }}>Beta overlap</Label>}
      {(n === 2 || n === 3) && (
        <div key="ok" data-presentation-allow-overlap="" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
          <Label id="c:ra" at={{ x: 100, y: 100, w: 200, h: 30 }}>Readable A</Label>
          <Label id="c:rb" at={{ x: 110, y: 105, w: 200, h: 30 }}>Readable B</Label>
        </div>
      )}
      {n === 3 && <Label key="g" id="c:g" at={{ x: 500, y: 200, w: 200, h: 30 }}>Gamma overlap</Label>}
      {n === 3 && <Label key="d" id="c:d" at={{ x: 510, y: 205, w: 200, h: 30 }}>Delta overlap</Label>}
      {n === 4 && <Label key="clean" id="c:clean" at={{ x: 100, y: 100, w: 200, h: 30 }}>All clear</Label>}
    </SceneLayer>
  )
}

const era = (n: number) => (n <= 2 ? 'first' : 'second')
const STEPS: Step<P>[] = [1, 2, 3, 4].map((n) => ({ id: `s${n}`, era: era(n), title: `Collide ${n}`, caption: `Caption ${n}`, Scene, groupKey: 'c', payload: { n } }))

export default function Talk() {
  return <Presentation steps={STEPS} title="Collide" />
}

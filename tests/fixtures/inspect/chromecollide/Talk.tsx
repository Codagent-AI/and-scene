import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './styles.css'

// Scene text sits under the Next button (pinned over the stage by the CSS), a scene/chrome
// collision between text and a control box that has no text of its own in common.
function Scene({ payload }: SceneProps<{ n: number }>) {
  return (
    <SceneLayer>
      <Label key={payload.n} id="cc:l" at={{ x: 340, y: 175, w: 200, h: 30 }}>{`Under the button ${payload.n}`}</Label>
    </SceneLayer>
  )
}

const STEPS: Step<{ n: number }>[] = [1, 2].map((n) => ({ id: `s${n}`, era: 'only', title: `Chrome ${n}`, caption: `Caption ${n}`, Scene, groupKey: 'cc', payload: { n } }))

export default function Talk() {
  return <Presentation className="chromecollide" steps={STEPS} title="Chrome collide" />
}

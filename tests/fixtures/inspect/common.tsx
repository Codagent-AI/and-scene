// Controlled presentations for the screenshot-helper integration test. Copied
// into a throwaway app under src/presentations/fx/ (imports are rewritten).
import { Appear, Label, Presentation, SceneLayer } from '../../../src/presentation-kit/index.ts'
import type { SceneProps, Step } from '../../../src/presentation-kit/index.ts'

export interface Item {
  id: string
  text: string
  x: number
  y: number
  /** Wrap in an allow-overlap subtree. */
  allow?: boolean
  /** Slide in with a CSS transition after the step becomes active. */
  slide?: boolean
}

export interface Payload {
  items: Item[]
}

function FxScene({ payload }: SceneProps<Payload>) {
  const loose = payload.items.filter((i) => !i.allow)
  const allowed = payload.items.filter((i) => i.allow)
  return (
    <SceneLayer>
      {loose.map((item) => (
        <Appear key={item.id} delay={0}>
          <Label id={item.id} x={item.x} y={item.y} className={item.slide ? 'slide' : undefined}>
            {item.text}
          </Label>
        </Appear>
      ))}
      {allowed.length > 0 && (
        <Appear key="allowed" delay={0}>
          <div data-presentation-allow-overlap="">
            {allowed.map((item) => (
              <Label key={item.id} id={item.id} x={item.x} y={item.y}>
                {item.text}
              </Label>
            ))}
          </div>
        </Appear>
      )}
    </SceneLayer>
  )
}

export const makeSteps = (frames: Item[][]): Step<Payload>[] =>
  frames.map((items, i) => ({
    id: `fx-${i}`,
    groupKey: 'fx',
    era: i === 0 ? 'first' : 'later',
    title: `Fixture step ${i}`,
    caption: `Fixture caption ${i}`,
    Scene: FxScene,
    payload: { items },
  }))

export function Fixture({ frames, className, attribution }: { frames: Item[][]; className?: string; attribution?: null }) {
  return (
    <Presentation
      steps={makeSteps(frames)}
      title="fixture"
      className={className}
      attribution={attribution}
    />
  )
}

export const A: Item = { id: 'alpha', text: 'Alpha text', x: 60, y: 60 }
export const B_FAR: Item = { id: 'beta', text: 'Beta text', x: 500, y: 250 }
export const B_ON_A: Item = { id: 'beta', text: 'Beta text', x: 70, y: 66 }

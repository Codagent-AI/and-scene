import { useEffect } from 'react'
import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'

function Scene({ payload }: SceneProps<{ n: number }>) {
  return (
    <SceneLayer>
      <Label key={payload.n} id="k:l" at={{ x: 100, y: 100, w: 300, h: 30 }}>{`Stuck ${payload.n}`}</Label>
    </SceneLayer>
  )
}

const STEPS: Step<{ n: number }>[] = [1, 2, 3].map((n) => ({ id: `s${n}`, era: 'only', title: `Stuck ${n}`, caption: `Caption ${n}`, Scene, groupKey: 'k', payload: { n } }))

// A capture-phase handler swallows ArrowRight, so the public step index never advances.
export default function Talk() {
  useEffect(() => {
    const swallow = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') e.stopImmediatePropagation()
    }
    window.addEventListener('keydown', swallow, true)
    return () => window.removeEventListener('keydown', swallow, true)
  }, [])
  return <Presentation steps={STEPS} title="Stuck" />
}

import { useEffect } from 'react'
import type { SceneProps, Step } from '../../src/presentation-kit'

export const mounts: string[] = []

export function CountingScene({ payload }: SceneProps<{ n: number }>) {
  useEffect(() => {
    mounts.push('mount')
  }, [])
  return <div data-testid="scene">scene {payload.n}</div>
}

export function OtherScene({ payload }: SceneProps<{ n: number }>) {
  return <div data-testid="other">other {payload.n}</div>
}

const eras = ['one', 'one', 'two', 'two']
export const makeSteps = (grouped = true): Step<{ n: number }>[] =>
  ['a', 'b', 'c', 'd'].map((id, i) => ({
    id,
    era: eras[i],
    title: `Title ${id}`,
    caption: `Caption ${id}`,
    Scene: grouped || i % 2 === 0 ? CountingScene : OtherScene,
    groupKey: grouped ? 'g' : undefined,
    payload: { n: i },
  }))

export function touch(type: 'touchstart' | 'touchend', x: number, y = 0) {
  const e = new Event(type, { bubbles: true })
  Object.defineProperty(e, 'changedTouches', { value: [{ clientX: x, clientY: y }] })
  window.dispatchEvent(e)
}

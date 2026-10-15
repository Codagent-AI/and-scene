import type { SceneProps } from '../presentation-kit'

import { useEffect } from 'react'
import { counter } from './counter'

export function CounterScene({ payload }: SceneProps<{ label: string }>) {
  useEffect(() => {
    counter.mounts++
  }, [])
  return <div data-testid="scene">{payload.label}</div>
}

export function OtherScene({ payload }: SceneProps<{ n: number }>) {
  return <div data-testid="other">{payload.n}</div>
}


import { useEffect, useRef } from 'react'
import { mounts } from './counter'
import type { SceneProps } from '../../src/presentation-kit'


export interface CounterPayload {
  n: number
}

/** A scene that counts how many times it is mounted. */
export function CounterScene({ payload }: SceneProps<CounterPayload>) {
  const once = useRef(false)
  useEffect(() => {
    if (!once.current) {
      once.current = true
      mounts.count += 1
    }
  }, [])
  return <div data-testid="scene">scene {payload.n}</div>
}

export function PlainScene({ stepIndex }: SceneProps<undefined>) {
  return <div data-testid="plain">plain {stepIndex}</div>
}


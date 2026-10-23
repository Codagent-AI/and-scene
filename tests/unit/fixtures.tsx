import { useEffect } from 'react'
import { Box, SceneLayer } from '../../src/presentation-kit'
import type { SceneProps, Step } from '../../src/presentation-kit'

export const mounts = { count: 0, unmounts: 0 }

export interface Payload {
  ids: string[]
}

export function CountingScene({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    mounts.count++
    return () => {
      mounts.unmounts++
    }
  }, [])
  return (
    <SceneLayer>
      {payload.ids.map((id) => (
        <Box key={id} id={id} x={0} y={0} width={10} height={10}>
          {id}
        </Box>
      ))}
    </SceneLayer>
  )
}

export function OtherScene() {
  return <div data-testid="other">other</div>
}

export function makeSteps(eras: string[], group = true): Step<Payload>[] {
  return eras.map((era, i) => ({
    id: `step-${i}`,
    era,
    title: `Title ${i}`,
    caption: `Caption ${i}`,
    groupKey: group ? 'g' : undefined,
    Scene: CountingScene,
    payload: { ids: ['a', ...(i > 0 ? ['b'] : [])] },
  }))
}

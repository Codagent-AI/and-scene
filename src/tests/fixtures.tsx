import { Box, SceneLayer, type SceneProps } from '../presentation-kit'

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


export function ExitScene({ payload }: SceneProps<{ show: boolean }>) {
  return (
    <SceneLayer>
      {payload.show && (
        <Box id="exit-node" style={{ position: 'absolute', left: 10, top: 10 }}>
          leaving
        </Box>
      )}
    </SceneLayer>
  )
}

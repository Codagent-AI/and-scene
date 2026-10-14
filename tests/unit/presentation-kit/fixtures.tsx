import { useState } from 'react'
import { Arrow, Box, SceneLayer } from '../../../src/presentation-kit'
import type { SceneProps } from '../../../src/presentation-kit'

// Test-only presentation fixture. It is never registered in src/presentations.
export interface CounterPayload {
  count: number
  label: string
}

let instanceCount = 0

// Each mounted instance gets its own id, so a test can tell a remount from an update.
export function Counter({ payload }: SceneProps<CounterPayload>) {
  const [instance] = useState(() => ++instanceCount)
  return (
    <SceneLayer data={{ "data-testid": "counter-scene", "data-instance": String(instance) }}>
      <Box id="counter-box" x={40} y={40} width={120 + payload.count * 10} height={60}>
        {payload.label}
      </Box>
    </SceneLayer>
  )
}

export function Diagram() {
  return (
    <SceneLayer>
      <Box id="diagram-box" x={10} y={10} width={100} height={40} />
      <Arrow id="diagram-arrow" x1={0} y1={0} x2={100} y2={100} />
    </SceneLayer>
  )
}

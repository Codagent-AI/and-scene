import { useEffect, type ReactNode } from 'react'
import { Box, Presentation, type SceneProps, type Step } from '../../src/presentation-kit/index.ts'

export interface DemoPayload {
  label: string
  x: number
}

export const mountLog = { mounts: 0, payloads: [] as string[] }

export function resetMountLog() {
  mountLog.mounts = 0
  mountLog.payloads = []
}

/** A scene that records mounts and renders one entity driven by its payload. */
export function CounterScene({ payload }: SceneProps<DemoPayload>): ReactNode {
  mountLog.payloads.push(payload.label)
  useEffect(() => {
    mountLog.mounts++
  }, [])
  return (
    <Box id="entity" data-testid="entity" style={{ left: payload.x, top: 10, width: 40 + payload.x, height: 20 }}>
      {payload.label}
    </Box>
  )
}

export function OtherScene({ payload }: SceneProps<DemoPayload>): ReactNode {
  return <div data-testid="other">{payload.label}</div>
}

export const demoSteps: Step<DemoPayload>[] = [
  { id: 'a', era: 'one', title: 'Title A', caption: 'Caption A', Scene: CounterScene, groupKey: 'g', payload: { label: 'A', x: 0 } },
  { id: 'b', era: 'one', title: 'Title B', caption: 'Caption B', Scene: CounterScene, groupKey: 'g', payload: { label: 'B', x: 50 } },
  { id: 'c', era: 'two', title: 'Title C', caption: 'Caption C', Scene: OtherScene, groupKey: 'h', payload: { label: 'C', x: 0 } },
  { id: 'd', era: 'two', title: 'Title D', caption: 'Caption D', Scene: OtherScene, groupKey: 'h', payload: { label: 'D', x: 0 } },
  { id: 'e', era: 'three', title: 'Title E', caption: 'Caption E', Scene: OtherScene, payload: { label: 'E', x: 0 } },
]

export function Demo(props: Partial<React.ComponentProps<typeof Presentation<DemoPayload>>>) {
  return <Presentation steps={demoSteps} title="Demo" {...props} />
}

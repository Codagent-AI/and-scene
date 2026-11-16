import { motion } from 'motion/react'
import { Presentation, Box } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
function TypedScene({ payload }: SceneProps<{ count: number }>) {
  return <><Box entityId="typed" style={{ position: 'absolute', left: payload.count, top: 20 }} className="local" /><motion.div layoutId="raw" style={{ left: 42 }} /></>
}
const steps: Step<{ count: number }>[] = [{ id: 'one', era: 'era', title: 'Title', caption: 'Caption', groupKey: 'typed', Scene: TypedScene, payload: { count: 1 } }]
export const typedBoundary = <Presentation title="Typed" steps={steps} />
// @ts-expect-error Typed scene payload rejects incompatible data.
export const wrongPayload: Step<{ count: number }> = { ...steps[0], payload: { count: 'bad' } }
// @ts-expect-error Step metadata is required.
export const missingMetadata: Step<{ count: number }> = { Scene: TypedScene, payload: { count: 1 } }

// Compiled by `tsc -b` (tsconfig.test.json): strongly typed grouped payloads cross the
// <Presentation> boundary with no casts, and a mismatched payload is rejected.
import { Box, Presentation } from '../../src/presentation-kit'
import type { SceneProps, Step } from '../../src/presentation-kit'
import { Appear, Arrow, Frame, Label, SceneLayer } from '../../src/presentation-kit'
import { Check } from 'lucide-react'

interface Payload {
  phase: 'a' | 'b'
}

function TypedScene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Box id="x" Icon={Check}>
        {payload.phase}
      </Box>
      <Box id="y">no icon</Box>
    </SceneLayer>
  )
}

const steps: Step<Payload>[] = [
  { id: '1', era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: { phase: 'a' }, groupKey: 'g' },
  { id: '2', era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: { phase: 'b' }, groupKey: 'g' },
]

export const ok = <Presentation steps={steps} title="typed" />

const bad: Step<Payload> = {
  id: '3',
  era: 'e',
  title: 't',
  caption: 'c',
  Scene: TypedScene,
  // @ts-expect-error payload must match the scene's payload type
  payload: { phase: 'c' },
}

// @ts-expect-error steps must carry every required narration field (no `caption`)
const missing: Step<Payload> = { id: '4', era: 'e', title: 't', Scene: TypedScene, payload: { phase: 'a' } }

// @ts-expect-error Icon must be a component, not an element
export const notComponent = <Box id="z" Icon={<Check />} />

export const unused = [bad, missing, Appear, Arrow, Frame, Label]

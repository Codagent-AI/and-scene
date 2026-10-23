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

const complete = { id: '4', era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: { phase: 'a' } } satisfies Step<Payload>

// Every required step field is enforced: omitting any one is a type error.
// @ts-expect-error missing `id`
const noId: Step<Payload> = { era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: complete.payload }
// @ts-expect-error missing `era`
const noEra: Step<Payload> = { id: '4', title: 't', caption: 'c', Scene: TypedScene, payload: complete.payload }
// @ts-expect-error missing `title`
const noTitle: Step<Payload> = { id: '4', era: 'e', caption: 'c', Scene: TypedScene, payload: complete.payload }
// @ts-expect-error missing `caption`
const noCaption: Step<Payload> = { id: '4', era: 'e', title: 't', Scene: TypedScene, payload: complete.payload }
// @ts-expect-error missing `Scene`
const noScene: Step<Payload> = { id: '4', era: 'e', title: 't', caption: 'c', payload: complete.payload }
// @ts-expect-error missing `payload`
const noPayload: Step<Payload> = { id: '4', era: 'e', title: 't', caption: 'c', Scene: TypedScene }

// @ts-expect-error Icon must be a component, not an element
export const notComponent = <Box id="z" Icon={<Check />} />

export const unused = [bad, noId, noEra, noTitle, noCaption, noScene, noPayload, Appear, Arrow, Frame, Label]

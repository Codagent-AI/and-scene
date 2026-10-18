// Compile-time fixture: checked by `tsc -b` as part of `npm run build`. It has no runtime tests.
import { Presentation } from '../presentation-kit'
import type { SceneProps, Step } from '../presentation-kit'

interface Payload {
  count: number
}

function CountScene({ payload }: SceneProps<Payload>) {
  // `payload.count` is typed as number with no casts.
  const doubled: number = payload.count * 2
  return <p>{doubled}</p>
}

function NameScene({ payload }: SceneProps<{ name: string }>) {
  return <p>{payload.name}</p>
}

const meta = { era: 'e', title: 't', caption: 'c' } as const

export const typed: Step<Payload>[] = [
  { id: 'a', ...meta, groupKey: 'g', Scene: CountScene, payload: { count: 1 } },
  { id: 'b', ...meta, groupKey: 'g', Scene: CountScene, payload: { count: 2 } },
]

export const accepted = <Presentation steps={typed} title="typed" />

export const wrongPayload: Step<Payload> = {
  id: 'x',
  ...meta,
  Scene: CountScene,
  // @ts-expect-error payload must match the Scene's payload type
  payload: { count: 'many' },
}

export const mismatchedScene: Step<Payload> = {
  id: 'y',
  ...meta,
  // @ts-expect-error Scene expecting another payload type cannot be paired with this step
  Scene: NameScene,
  payload: { count: 1 },
}

export const missingNarration = {
  id: 'z',
  era: 'e',
  caption: 'c',
  Scene: CountScene,
  payload: { count: 1 },
}
// @ts-expect-error steps need a title
export const incomplete: Step<Payload> = missingNarration

// @ts-expect-error a mismatched step cannot be mixed into a typed deck
export const mixed = <Presentation steps={[...typed, { id: 'w', ...meta, Scene: NameScene, payload: { name: 'n' } }]} title="mixed" />

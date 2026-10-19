import { Arrow, Box, SceneLayer, type SceneProps } from '../../../presentation-kit'
import { LABELS, RECTS, SEGMENTS, introducedAt, type EntityId } from '../entities'

/** Diagram state for one step: which entities are on screen. */
export interface StarterPayload {
  present: readonly EntityId[]
}

/** One persistent scene shared by every starter step; newcomers fade in, the rest morph. */
export function StarterScene({ payload, index }: SceneProps<StarterPayload>) {
  return (
    <SceneLayer>
      {payload.present.map((id) => {
        const enter = introducedAt(id) === index
        if (id in SEGMENTS) {
          const seg = SEGMENTS[id as keyof typeof SEGMENTS]
          return <Arrow key={id} id={id} enter={enter} from={seg.from} to={seg.to} />
        }
        const rect = RECTS[id as keyof typeof RECTS]
        return <Box key={id} id={id} enter={enter} {...rect} label={LABELS[id as keyof typeof RECTS]} />
      })}
    </SceneLayer>
  )
}

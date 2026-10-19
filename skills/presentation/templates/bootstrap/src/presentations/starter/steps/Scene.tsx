import { Arrow, Box, SceneLayer, type SceneProps } from '../../../presentation-kit'
import { LABELS, RECTS, SEGMENTS, type EntityId } from '../entities'

/** Diagram state for one step: which entities are on screen. */
export interface StarterPayload {
  present: readonly EntityId[]
}

/** One persistent scene shared by every starter step; entities absent from the previously displayed step fade in, the rest morph. */
export function StarterScene({ payload, previous }: SceneProps<StarterPayload>) {
  const shown = new Set<EntityId>(previous?.present)
  return (
    <SceneLayer>
      {payload.present.map((id) => {
        const enter = previous !== undefined && !shown.has(id)
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

import { Appear, Presence, SceneLayer, type SceneProps } from '../../../presentation-kit'
import { SAMPLE_ENTITIES } from './layout'

export interface SamplePayload {
  /** Number of beats revealed so far (1-9); each beat only adds to what is on screen. */
  stage: number
}

/** One scene for all nine beats: the host keeps it mounted and only `stage` changes. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return (
    <SceneLayer>
      <Presence>
        {SAMPLE_ENTITIES.filter((entity) => entity.from <= payload.stage).map((entity) => (
          <Appear key={entity.key}>{entity.node}</Appear>
        ))}
      </Presence>
    </SceneLayer>
  )
}

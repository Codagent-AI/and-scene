import type { ReactNode } from 'react'
import {
  Appear,
  Arrow,
  Box,
  Presence,
  SceneLayer,
  type SceneProps,
} from '__KIT__'
import { E } from '../entities'

export interface ScenePayload {
  /** Number of beats revealed so far; each beat only adds to what is on screen. */
  stage: number
}

/** Each entity enters at `from` and then stays; give it new coordinates to make it morph. */
const ENTITIES: { from: number; key: string; node: ReactNode }[] = [
  {
    from: 1,
    key: E.first,
    node: <Box id={E.first} x={120} y={150} w={200} h={80} className="__SLUG__-box">first</Box>,
  },
  {
    from: 2,
    key: E.second,
    node: <Box id={E.second} x={560} y={150} w={200} h={80} className="__SLUG__-box">second</Box>,
  },
  {
    from: 2,
    key: E.link,
    node: <Arrow id={E.link} from={[328, 190]} to={[552, 190]} />,
  },
]

/** One scene for every beat: the host keeps it mounted and only `stage` changes. */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      <Presence>
        {ENTITIES.filter((entity) => entity.from <= payload.stage).map((entity) => (
          <Appear key={entity.key}>{entity.node}</Appear>
        ))}
      </Presence>
    </SceneLayer>
  )
}

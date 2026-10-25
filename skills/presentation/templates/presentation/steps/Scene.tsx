import {
  Appear,
  Arrow,
  Box,
  SceneLayer,
  type SceneProps,
} from '../../../presentation-kit/index.ts'
import { E } from '../entities.ts'

export interface Payload {
  /** 1-based count of beats revealed so far; entities accumulate with it. */
  stage: number
}

/** One persistent scene. Entities keep their ids across steps, so they morph in place. */
export function Scene({ payload: { stage } }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Box id={E.subject} at={{ x: 80, y: 130, w: 220, h: 80 }}>
        <strong>{__TITLE_JSON__}</strong>
      </Box>
      <Appear when={stage >= 2}>
        <Arrow id={E.link} from={[300, 170]} to={[560, 170]} />
        <Box id={E.detail} at={{ x: 560, y: 130, w: 220, h: 80 }}>
          the next idea
        </Box>
      </Appear>
    </SceneLayer>
  )
}

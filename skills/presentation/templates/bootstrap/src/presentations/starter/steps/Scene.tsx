import type { ReactElement } from 'react'
import { Arrow, Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { AT, E } from '../entities'

export interface ScenePayload {
  /** 1-based beat; each beat adds entities and keeps existing ones in place. */
  stage: number
}

/** One evolving scene: persisting entities keep their ids, newcomers `appear`. */
export function MainScene({ payload }: SceneProps<ScenePayload>) {
  const s = payload.stage
  const items: ReactElement[] = []
  if (s >= 1) {
    items.push(
      <Box key="topic" layoutId={E.topic} at={AT.topic} appear>
        Topic
      </Box>,
    )
  }
  if (s >= 2) {
    items.push(
      <Arrow key="link" layoutId={E.link} from={{ x: 264, y: 185 }} to={{ x: 336, y: 185 }} appear />,
      <Box key="detail" layoutId={E.detail} at={AT.detail} appear>
        Detail
      </Box>,
    )
  }
  if (s >= 3) {
    items.push(
      <Arrow key="link2" layoutId={`${E.link}-2`} from={{ x: 544, y: 185 }} to={{ x: 616, y: 185 }} appear />,
      <Box key="result" layoutId={E.result} at={AT.result} appear>
        Result
      </Box>,
    )
  }
  return <SceneLayer>{items}</SceneLayer>
}

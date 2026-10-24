import { AnimatePresence, Appear, Arrow, Box, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { ENTITIES } from './entities'
import type { EntityKey, SceneState } from './entities'

const render: Record<EntityKey, () => React.ReactNode> = {
  idea: () => (
    <Box id={ENTITIES.idea.id} x={60} y={140} width={200} height={90}>
      idea
    </Box>
  ),
  detail: () => (
    <Box id={ENTITIES.detail.id} x={340} y={140} width={200} height={90}>
      detail
    </Box>
  ),
  link: () => <Arrow id={ENTITIES.link.id} from={{ x: 264, y: 185 }} to={{ x: 336, y: 185 }} />,
  result: () => (
    <Box id={ENTITIES.result.id} x={620} y={140} width={200} height={90}>
      result
    </Box>
  ),
}

const ORDER = Object.keys(ENTITIES) as EntityKey[]

/** One evolving scene: entities accumulate step by step and keep their identity. */
export function Scene({ payload }: SceneProps<SceneState>) {
  return (
    <SceneLayer>
      <AnimatePresence>
        {ORDER.filter((key) => ENTITIES[key].since <= payload.upTo).map((key) => (
          <Appear key={ENTITIES[key].id}>{render[key]()}</Appear>
        ))}
      </AnimatePresence>
    </SceneLayer>
  )
}

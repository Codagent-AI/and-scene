import { Appear, Arrow, Box, SceneLayer } from '../../presentation-kit/index.ts'
import type { SceneProps } from '../../presentation-kit/index.ts'
import { entitiesAt } from './entities.ts'

export interface Payload {
  /** 1-based step number whose entities are on screen. */
  stage: number
}

/** One persistent scene: only `payload.stage` changes between steps. */
export function Scene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      {entitiesAt(payload.stage).map((e) => (
        <Appear key={e.id} enter={e.from === payload.stage}>
          {e.kind === 'arrow' ? (
            <Arrow layoutId={e.id} from={[e.x, e.y]} to={[e.x + e.w, e.y + e.h]} />
          ) : (
            <Box layoutId={e.id} x={e.x} y={e.y} w={e.w} h={e.h}>
              {e.text}
            </Box>
          )}
        </Appear>
      ))}
    </SceneLayer>
  )
}

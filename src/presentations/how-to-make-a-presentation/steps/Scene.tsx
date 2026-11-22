import { AnimatePresence } from 'motion/react'
import { User, Sparkles } from 'lucide-react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { SceneProps } from '../../../presentation-kit/types'
import { entityId, stateFor } from '../entities'
export function StoryScene({ payload }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>{stateFor(payload).map(entity => <Appear key={entity.id} style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.w, height: entity.h }}>
    <Box entityId={entityId(entity.id)} role={entity.description ? 'img' : undefined} aria-label={entity.description} className={`story-entity ${entity.kind}`} style={{ width: '100%', height: '100%', boxSizing: 'border-box' }} Icon={entity.kind === 'person' ? User : entity.kind === 'skill' ? Sparkles : undefined}>
      <span>{entity.label}</span>
      {entity.kind === 'card' && <small>title<br />caption<br /><b>visual</b></small>}
      {entity.kind === 'verify' && <small>build ✓<br />render ✓</small>}
    </Box>
  </Appear>)}</AnimatePresence></SceneLayer>
}

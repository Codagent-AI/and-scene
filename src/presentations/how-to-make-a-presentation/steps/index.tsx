import { AnimatePresence, motion } from 'motion/react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { identity, visibleEntities } from '../entities'
import outline from '../outline.json'
export interface Beat { beat: number }
export function EvolvingScene({ payload }: SceneProps<Beat>) {
  return <SceneLayer>
    <AnimatePresence>
      {visibleEntities(payload.beat).map(entity => <Appear key={entity.id} style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.width, height: entity.height }}>
        <Box identity={identity(entity.id)} className={`entity entity-${entity.kind}`} data-entity-id={entity.id} style={{ width: '100%', height: '100%' }}>
          <span className="entity-label">{entity.label}</span>
          {entity.detail && <span className="entity-detail">{entity.detail}</span>}
        </Box>
      </Appear>)}
      {payload.beat >= 7 && <Appear key="modify" className="modify-arc" style={{ position: 'absolute', left: 505, top: 118, width: 282, height: 47 }}>
        <motion.svg viewBox="0 0 282 47" width="282" height="47" aria-label="modify arc from conversation to edited card"><path d="M268 0 Q280 36 147 35 L0 35 M8 28 L0 35 L8 42" fill="none" stroke="currentColor" strokeWidth="1.5" /><text x="72" y="19">ask → edit → keep going</text></motion.svg>
      </Appear>}
    </AnimatePresence>
  </SceneLayer>
}
export const STEPS: Step<Beat>[] = outline.map((meta, beat) => ({ ...meta, Scene: EvolvingScene, payload: { beat }, groupKey: 'one-continuous-scene' }))

import { AnimatePresence, motion } from 'motion/react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { identity, visibleEntities } from '../entities'
import outline from '../outline.json'
import { COMPACT_FONT_SIZE, compactCopy } from '../compact'
export interface Beat { beat: number }
export function EvolvingScene({ payload }: SceneProps<Beat>) {
  return <SceneLayer>
    <AnimatePresence>
      {visibleEntities(payload.beat).map(entity => <Appear key={entity.id} style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.width, height: entity.height }}>
        <Box identity={identity(entity.id)} className={`entity entity-${entity.kind}`} data-entity-id={entity.id} role="img" aria-label={entity.id === 'conversation' ? 'Two-way conversation between you and skill' : [entity.label, entity.detail].filter(Boolean).join('. ')} style={{ width: '100%', height: '100%' }}>
          <span className="entity-label entity-label-full" aria-hidden="true">{entity.label}</span>
          {entity.detail && <span className="entity-detail entity-detail-full" aria-hidden="true">{entity.detail}</span>}
          {compactCopy[entity.id] && <span className="entity-label entity-label-compact" aria-hidden="true" style={{ fontSize: COMPACT_FONT_SIZE }}>{compactCopy[entity.id].label}</span>}
          {compactCopy[entity.id]?.detail && <span className="entity-detail entity-detail-compact" aria-hidden="true" style={{ fontSize: COMPACT_FONT_SIZE }}>{compactCopy[entity.id].detail}</span>}
          {entity.id === 'conversation' && <svg className="conversation-compact" viewBox="0 0 270 24" aria-hidden="true"><path d="M3 12 H267 M12 3 L3 12 L12 21 M258 3 L267 12 L258 21" fill="none" stroke="currentColor" strokeWidth="3" /></svg>}
        </Box>
      </Appear>)}
      {payload.beat >= 7 && <Appear key="modify" className="modify-arc" style={{ position: 'absolute', left: 505, top: 118, width: 282, height: 47 }}>
        <motion.svg viewBox="0 0 282 47" width="282" height="47" aria-label="modify arc from conversation to edited card"><path d="M268 0 Q280 36 147 35 L0 35 M8 28 L0 35 L8 42" fill="none" stroke="currentColor" strokeWidth="1.5" /><text x="72" y="19">ask → edit → keep going</text></motion.svg>
      </Appear>}
    </AnimatePresence>
  </SceneLayer>
}
export const STEPS: Step<Beat>[] = outline.map((meta, beat) => ({ ...meta, Scene: EvolvingScene, payload: { beat }, groupKey: 'one-continuous-scene' }))

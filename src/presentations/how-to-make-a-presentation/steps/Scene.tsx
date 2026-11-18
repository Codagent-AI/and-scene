import { AnimatePresence } from 'motion/react'
import { Box, Label, Frame, SceneLayer } from '../../../presentation-kit'
import { ENTER_DELAY, ENTER_T, LAYOUT_T, EASE } from '../../../presentation-kit/constants'
import type { SceneProps } from '../../../presentation-kit'
import { entityId, visibleEntities } from '../entities'
export interface SamplePayload { beat: number }
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return <SceneLayer><AnimatePresence>{visibleEntities(payload.beat).map(entity => {
    const Node = entity.kind === 'reveal' ? Frame : ['connection', 'link', 'modify'].includes(entity.kind) ? Label : Box
    return <Node key={entity.id} id={entityId(entity.id)} data-sample-entity={entity.id} data-sample-kind={entity.kind}
      className={`sample-entity ${entity.kind}`} style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.w, height: entity.h }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ opacity: { duration: ENTER_T, delay: ENTER_DELAY }, layout: { duration: LAYOUT_T, ease: EASE } }}>
      {entity.kind === 'card' ? <><strong>{entity.text}</strong><span>title</span><span>caption</span><span className="visual-mini">◇ visual</span></> : entity.kind === 'verify' ? <><strong>{entity.text}</strong><span>build + render</span><span>all steps pass</span></> : <span>{entity.text}</span>}
    </Node>
  })}</AnimatePresence></SceneLayer>
}

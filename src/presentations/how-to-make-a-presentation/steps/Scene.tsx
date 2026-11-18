import { AnimatePresence } from 'motion/react'
import { Box, Label, Frame, SceneLayer } from '../../../presentation-kit'
import { ENTER_DELAY, ENTER_T, LAYOUT_T, EASE } from '../../../presentation-kit/constants'
import type { SceneProps } from '../../../presentation-kit'
import { entityId, visibleEntities } from '../entities'
export interface SamplePayload { beat: number }
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return <SceneLayer><AnimatePresence>{visibleEntities(payload.beat).map(entity => {
    const Node = entity.kind === 'reveal' ? Frame : ['connection', 'link', 'modify'].includes(entity.kind) ? Label : Box
    return <Node key={entity.id} id={entityId(entity.id)} data-sample-entity={entity.id} data-sample-kind={entity.kind} data-sample-flags={entity.kind === 'flag' ? 'card-2' : undefined}
      className={`sample-entity ${entity.kind}`} style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.w, height: entity.h }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ opacity: { duration: ENTER_T, delay: ENTER_DELAY }, layout: { duration: LAYOUT_T, ease: EASE } }}>
      {entity.kind === 'modify' ? <svg viewBox="0 0 482 102" width="482" height="102" aria-label="Modification from the skill to step 2">
        <defs><marker id="sample-modify-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" /></marker></defs>
        <path data-sample-modify-path="" d="M252 0 H462 Q482 0 482 20 V40 Q482 60 462 60 H20 Q0 60 0 80 V102" markerEnd="url(#sample-modify-arrow)" />
        <text x="270" y="22">{entity.text}</text>
      </svg> : entity.kind === 'card' ? <><strong>{entity.text}</strong><span>title</span><span>caption</span><span className="visual-mini">◇ visual</span></> : entity.kind === 'verify' ? <><strong>{entity.text}</strong><span>build + render</span><span>all steps pass</span></> : <span>{entity.text}</span>}
    </Node>
  })}</AnimatePresence></SceneLayer>
}

import { AnimatePresence, motion } from 'motion/react'
import { Box, Frame, SceneLayer, EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entitiesAt } from '../entities'
export interface Beat { beat: number }
export function StoryScene({ payload }: SceneProps<Beat>) {
  return <SceneLayer><AnimatePresence>{entitiesAt(payload.beat).map(e => {
    const Node = e.kind === 'reveal' ? Frame : Box
    return <Node key={e.id} id={e.id} data-entity={e.id} data-kind={e.kind} className={`story-entity ${e.kind}`} style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.h }} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T, delay: ENTER_DELAY }, y: { duration: ENTER_T, delay: ENTER_DELAY } }}>
      {e.kind === 'card' ? <><strong>{e.label}</strong><span>title · caption · visual</span>{e.id === 'how-to:card-3' && payload.beat >= 8 && <motion.small data-edited="" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>edited ✓</motion.small>}</> : e.kind === 'verify' ? <><strong>{e.label} ✓</strong><span>build ✓ / render ✓</span></> : <span>{e.label}</span>}
      {e.kind === 'morph' && <small>morph</small>}
    </Node>
  })}</AnimatePresence></SceneLayer>
}

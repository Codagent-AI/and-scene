import { AnimatePresence, motion } from 'motion/react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { ENTER_T, LAYOUT_T } from '../../../presentation-kit/constants'
import type { SceneProps } from '../../../presentation-kit/types'
import { entity } from '../entities'
import { nodes } from './nodes'
export function StoryScene({ payload: beat }: SceneProps<number>) {
 return <SceneLayer>
 <svg className="story-connectors" width="880" height="380" aria-hidden="true">
 <defs><marker id="story-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
 {beat >= 2 && <motion.path data-story-connector="conversation" d="M189 67 H207 V110 H435 V67 H679" markerStart="url(#story-arrow)" markerEnd="url(#story-arrow)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={ENTER_T} />}
 {beat >= 8 && <motion.path data-story-connector="modify" d="M745 96 C850 110 850 158 450 170 L420 188" markerEnd="url(#story-arrow)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={LAYOUT_T} />}
 </svg><AnimatePresence>{nodes.filter(n => n.beat <= beat).map(n => <motion.div key={n.id} data-story-entity={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={ENTER_T} style={{ position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h, pointerEvents: 'none' }}>
 <Box id={entity(n.id)} className={`story-node story-${n.id}`} style={{ width: '100%', height: '100%' }}><span>{n.label}</span>{n.sub && <small>{n.sub}</small>}{n.id === 'reveal' && <b>AND SCENE. / YOU’RE LOOKING AT ONE.</b>}{n.id === 'verify' && <motion.i initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...LAYOUT_T, delay: .5 }} />}</Box>
 </motion.div>)}</AnimatePresence></SceneLayer>
}

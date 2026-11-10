import { AnimatePresence, motion } from 'motion/react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { ENTER_T, LAYOUT_T } from '../../../presentation-kit/constants'
import type { SceneProps } from '../../../presentation-kit/types'
import { entity } from '../entities'
import { nodes } from './nodes'
export function StoryScene({ payload: beat }: SceneProps<number>) {
 return <SceneLayer><AnimatePresence>{nodes.filter(n => n.beat <= beat).map(n => <motion.div key={n.id} data-story-entity={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={ENTER_T} style={{ position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h, pointerEvents: 'none' }}>
 <Box id={entity(n.id)} className={`story-node story-${n.id}`} style={{ width: '100%', height: '100%' }}><span>{n.label}</span>{n.sub && <small>{n.sub}</small>}{n.id === 'reveal' && <b>AND SCENE. / YOU’RE LOOKING AT ONE.</b>}{n.id === 'verify' && <motion.i initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...LAYOUT_T, delay: .5 }} />}</Box>
 </motion.div>)}</AnimatePresence></SceneLayer>
}

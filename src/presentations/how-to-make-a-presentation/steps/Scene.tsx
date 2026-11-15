import { AnimatePresence, motion } from 'motion/react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { EASE, ENTER_DELAY, ENTER_T } from '../../../presentation-kit/constants'
import type { SceneProps } from '../../../presentation-kit/types'
import { diagram, entity } from '../entities'
export function Scene({ payload: beat }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>{diagram(beat).map(n => <motion.div key={n.id} data-sample-entity={n.id} style={{ position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0, duration: ENTER_T } }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }}>
    <Box id={n.id} className={`diagram-${n.kind}`} data-edited={beat >= 8 && n.id === entity('step-2') ? 'true' : undefined} style={{ width: '100%', height: '100%' }}>
      {n.id === entity('verify') ? <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ENTER_DELAY, ease: EASE }}>✓ build + render</motion.span> : n.label.split('\n').map((line, i) => <span key={i}>{line}</span>)}
    </Box>
  </motion.div>)}</AnimatePresence></SceneLayer>
}

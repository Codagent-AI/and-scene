import { AnimatePresence, motion } from 'motion/react'
import { Appear, Box, Label, SceneLayer, ENTER_T } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entity, nodes } from '../entities'
export function Scene({payload}: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>{nodes.filter(n => n.at <= payload).map(n => <Appear key={n.name}><Box id={entity(n.name)} data-entity={n.name} className={`scene-node ${n.kind}`} style={{position:'absolute',left:n.x,top:n.y,width:n.w,height:n.h}}>
    <span>{n.text}</span>{n.kind === 'card' && <small>title · caption · visual</small>}{n.kind === 'verify' && <small>build + render</small>}{n.name === 'card-2' && <AnimatePresence>{payload >= 8 && <Label key="edited" id={entity('edited')} className="edited" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={ENTER_T}>edited</Label>}</AnimatePresence>}
  </Box></Appear>)}</AnimatePresence>
  <AnimatePresence>{payload >= 2 && <motion.div key="conversation" layoutId={entity('conversation')} className="conversation-line" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>←─────────────────→</motion.div>}
  {payload >= 4 && <motion.div key="links" className="card-links" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><span>→<small>morphs</small></span><span>→<small>morphs</small></span></motion.div>}
  {payload >= 7 && <motion.div key="verify-link" className="verify-link" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>→</motion.div>}
  {payload >= 8 && <motion.svg key="modify-arc" className="modify-arc" width="880" height="380" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><path d="M 600 135 Q 410 112 342 214" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" /></motion.svg>}</AnimatePresence>
  </SceneLayer>
}

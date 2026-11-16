import { AnimatePresence, motion } from 'motion/react'
import { Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer, Appear, type SceneProps } from '../../../presentation-kit'
import { sceneState } from '../entities'
export interface Beat { beat: number }
export function StoryScene({ payload }: SceneProps<Beat>) {
  return <SceneLayer><AnimatePresence>{sceneState(payload.beat).map(e => {
    const Node = e.kind === 'frame' ? Frame : e.kind === 'arrow' ? Arrow : e.kind === 'chip' ? SymbolChip : e.kind === 'modify' ? Emphasis : ['prompt','link'].includes(e.kind) ? Label : Box
    return <Appear key={e.id}><Node entityId={e.id} className={`entity ${e.kind}${payload.beat >= 8 && e.id.endsWith('card-2') ? ' edited' : ''}`} style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.h }}>
      {e.kind === 'card' ? <><strong>{e.text}</strong><span>title</span><span>caption</span><span>visual</span>{payload.beat >= 8 && e.id.endsWith('card-2') && <b className="edit-flag">edited</b>}</> : e.kind === 'verify' ? <><strong>verify</strong><span>build + render</span><motion.b initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .6, duration: .15 }}>✓ pass</motion.b></> : e.kind === 'frame' ? <span>{e.text}</span> : e.kind === 'modify' ? <><svg viewBox="0 0 355 40" aria-hidden="true"><path d="M 350 0 Q 350 25 280 25 L 38 25 Q 20 25 20 39 M 14 33 L 20 39 L 26 33" /></svg><span>{e.text}</span></> : e.text}
    </Node></Appear>
  })}</AnimatePresence></SceneLayer>
}

import { AnimatePresence, motion } from 'motion/react'
import { Box, Arrow, Frame, Label, SceneLayer, SymbolChip, ENTER_DELAY, ENTER_T } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entities } from '../entities'
export interface Payload { beat: number }
export const geometry: Record<string, { x: number; y: number; w: number; h: number; from: number }> = {
 you: { x: 76, y: 64, w: 115, h: 64, from: 1 }, prompt: { x: 76, y: 18, w: 115, h: 30, from: 1 },
 skill: { x: 635, y: 64, w: 150, h: 64, from: 2 }, conversation: { x: 210, y: 87, w: 405, h: 20, from: 2 }, question: { x: 327, y: 42, w: 172, h: 25, from: 2 },
 tray: { x: 67, y: 195, w: 736, h: 140, from: 3 }, card1: { x: 90, y: 215, w: 130, h: 96, from: 3 },
 card2: { x: 262, y: 215, w: 130, h: 96, from: 4 }, card3: { x: 434, y: 215, w: 130, h: 96, from: 4 },
 morph1: { x: 223, y: 245, w: 36, h: 34, from: 4 }, morph2: { x: 395, y: 245, w: 36, h: 34, from: 4 },
 ghost: { x: 576, y: 220, w: 43, h: 86, from: 5 }, depth: { x: 76, y: 133, w: 115, h: 25, from: 5 },
 socket: { x: 300, y: 325, w: 270, h: 35, from: 6 }, pipeline: { x: 622, y: 250, w: 20, h: 20, from: 7 }, verify: { x: 646, y: 215, w: 136, h: 96, from: 7 },
 modify: { x: 445, y: 138, w: 245, h: 65, from: 8 }, reveal: { x: 36, y: 3, w: 804, h: 372, from: 9 },
}
export function visibleEntities(beat: number) { return Object.keys(geometry).filter(id => geometry[id].from <= beat) }
function Content({ id, beat }: { id: string; beat: number }) {
 if (id === 'you') return <><span className="node-symbol">↗</span><strong>you</strong></>
 if (id === 'prompt') return <>“I have a topic…”</>
 if (id === 'skill') return <><span className="node-symbol">✳</span><strong>the skill</strong></>
 if (id === 'conversation') return <span className="conversation-line" aria-label="you to skill and skill to you">↔</span>
 if (id === 'question') return <>one question at a time</>
 if (id === 'tray') return <span className="tray-label">YOUR STORY / AN EVOLVING SCENE</span>
 if (id.startsWith('card')) return <><span className="card-number">0{id.at(-1)}</span><strong>{id === 'card1' ? 'The idea' : id === 'card2' ? 'The shape' : 'The story'}</strong><span className="card-parts">title · caption · visual</span><span className="mini-diagram">□ ─ ○</span>{id === 'card2' && beat >= 8 && <span className="edit-flag">edited ↺</span>}</>
 if (id.startsWith('morph')) return <><span>→</span><small>morph</small></>
 if (id === 'ghost') return <>···</>
 if (id === 'depth') return <>partial <span>↔</span> full</>
 if (id === 'socket') return <>⊞ shared scene kit · boxes, arrows, motion</>
 if (id === 'pipeline') return <>→</>
 if (id === 'verify') return <><strong>verify</strong><motion.span className="verify-checks" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: ENTER_DELAY + 0.35 }}>build + render</motion.span><motion.span className="verify-pass" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ENTER_DELAY + 0.6 }}>✓ passed</motion.span></>
 if (id === 'modify') return <><svg viewBox="0 0 245 65" aria-label="modify from conversation to route"><path d="M230 0 Q230 40 20 45 L0 63 M0 63 L14 59 M0 63 L4 48" /></svg><span>ask → edit in place</span></>
 if (id === 'reveal') return <span className="reveal-label">AND THIS IS ONE OF THOSE PRESENTATIONS.</span>
 return null
}
export function EvolvingScene({ payload: { beat } }: SceneProps<Payload>) {
 return <SceneLayer><AnimatePresence>{visibleEntities(beat).map(id => {
  const g = geometry[id]
  const Node = id === 'reveal' ? Frame : ['conversation', 'morph1', 'morph2', 'pipeline', 'modify'].includes(id) ? Arrow : ['question', 'depth'].includes(id) ? SymbolChip : id === 'prompt' ? Label : Box
  return <Node key={id} layoutId={entities[id]} data-entity={id} className={`entity ${id}`} style={{ position: 'absolute', left: g.x, top: g.y, width: g.w, height: g.h }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { delay: ENTER_DELAY, duration: ENTER_T } }}><Content id={id} beat={beat} /></Node>
 })}</AnimatePresence></SceneLayer>
}

import { AnimatePresence } from 'motion/react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { entity, visibleEntities } from '../entities'
import type { SceneProps } from '../../../presentation-kit/types'
const content: Record<string, React.ReactNode> = {
  you: <><span className="node-eyebrow">THE AUTHOR</span><strong>you</strong></>,
  prompt: <><span className="node-eyebrow">A STARTING POINT</span><strong>“I have a topic…”</strong></>,
  exchange: <svg aria-label="two-way exchange" viewBox="0 0 120 30" width="120" height="30"><path d="M2 15H118 M12 5L2 15L12 25 M108 5L118 15L108 25" stroke="currentColor" fill="none" strokeWidth="1.5" /></svg>, question: 'one question',
  skill: <><span className="node-eyebrow">YOUR COLLABORATOR</span><strong>the skill ✳</strong></>,
  tray: null,
  'card-1': <><b>01 / the opening</b><span>title · caption</span><small>+ a visual</small></>,
  'card-2': <><b>02 / the idea</b><span>title · caption</span><small>+ a visual</small></>,
  'card-3': <><b>03 / the payoff</b><span>title · caption</span><small>+ a visual</small></>,
  'morph-1': <><span>→</span><small>morph</small></>, 'morph-2': <><span>→</span><small>morph</small></>,
  ghost: '+ your next beat', depth: 'partial ⟷ full', kit: '⊞ shared scene kit · shapes + motion',
  verify: <><b>✓ verified</b><small>build + render</small></>,
  modify: <><span className="modify-line">↘</span><small>ask → edit in place</small></>,
  edited: '↻ refined', reveal: <span>AND SCENE / THIS IS THE OUTPUT</span>,
}
export function ReferenceScene({ payload: beat }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>
    {visibleEntities(beat).map(p => <Appear key={p.name} style={{ position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.h }}>
      <Box id={entity(p.name)} className={`entity ${p.name}`} style={{ width: '100%', height: '100%' }}>{content[p.name]}</Box>
    </Appear>)}
  </AnimatePresence></SceneLayer>
}

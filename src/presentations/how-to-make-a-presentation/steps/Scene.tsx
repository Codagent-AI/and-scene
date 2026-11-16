import { AnimatePresence } from 'motion/react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { entity, visibleEntities } from '../entities'
import type { SceneProps } from '../../../presentation-kit/types'
function card(number: number) {
  return <><b>{number} · Title</b><span>Caption</span><small>Visual</small></>
}
function morphLink() {
  return <><svg aria-hidden="true" width="96" height="24" viewBox="0 0 96 24"><path d="M2 12H94 M85 3L94 12L85 21" stroke="currentColor" fill="none" strokeWidth="3" /></svg><small>morph</small></>
}
const content: Record<string, React.ReactNode> = {
  you: <strong>you</strong>, prompt: <strong>a topic</strong>,
  exchange: <svg aria-label="two-way exchange" viewBox="0 0 120 30" width="120" height="30"><path d="M2 15H118 M12 5L2 15L12 25 M108 5L118 15L108 25" stroke="currentColor" fill="none" strokeWidth="3" /></svg>,
  question: 'question', skill: <strong>skill</strong>, tray: null,
  'card-1': card(1), 'card-2': card(2), 'card-3': card(3),
  'morph-1': morphLink(), 'morph-2': morphLink(),
  ghost: 'next?', depth: 'partial ↔ full', kit: 'shared scene kit',
  'verify-link': <svg viewBox="0 0 20 24" width="20" height="24" aria-label="then verify"><path d="M2 12H18 M11 5L18 12L11 19" stroke="currentColor" fill="none" strokeWidth="3" /></svg>,
  verify: <><b>verify</b><svg className="pass-mark" aria-label="build and render passed" width="40" height="40" viewBox="0 0 40 40"><path d="M8 20L16 28L32 12" stroke="currentColor" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg></>,
  modify: <><svg aria-hidden="true" viewBox="0 0 240 90" width="240" height="90"><path d="M236 2C236 45 10 30 10 86 M2 76L10 86L18 76" stroke="currentColor" fill="none" strokeWidth="3" strokeDasharray="7 5" /></svg><small>edit</small></>,
  edited: 'edited', reveal: <span>output</span>,
}
export function ReferenceScene({ payload: beat }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>
    {visibleEntities(beat).map(p => <Appear key={p.name} style={{ position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.h }}>
      <Box id={entity(p.name)} className={`entity ${p.name}`} style={{ width: '100%', height: '100%' }}>{content[p.name]}</Box>
    </Appear>)}
  </AnimatePresence></SceneLayer>
}

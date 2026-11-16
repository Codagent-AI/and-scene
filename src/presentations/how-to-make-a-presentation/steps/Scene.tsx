import { AnimatePresence, motion } from 'motion/react'
import { UserRound, Sparkles, Check, Layers } from 'lucide-react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { entity, positions } from '../entities'
import type { SceneProps } from '../../../presentation-kit/types'
import type { ReactNode } from 'react'

type EntityName = keyof typeof positions
function Item({ name, children, className = '' }: { name: EntityName; children: ReactNode; className?: string }) {
  const [left, top, width, height] = positions[name]
  return <Appear style={{ position: 'absolute', left, top, width, height }}><Box entityId={entity(name)} data-entity={name} className={className} style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}>{children}</Box></Appear>
}
export function GuideScene({ payload: beat }: SceneProps<number>) {
  return <SceneLayer>
    <AnimatePresence>
      <Item key="you" name="you" className="actor"><UserRound size={19} /><strong>you</strong></Item>
      <Item key="prompt" name="prompt" className="prompt"><small>THE STARTING POINT</small><span>“I have a topic…”</span></Item>
      {beat >= 2 && <Item key="skill" name="skill" className="actor skill"><Sparkles size={19} /><strong>skill</strong></Item>}
      {beat >= 2 && <Item key="conversation" name="conversation" className="conversation">⟷</Item>}
      {beat >= 2 && <Item key="question" name="question" className="question">one question at a time</Item>}
      {beat >= 3 && <Item key="tray" name="tray" className="tray"><span>THE STORY TAKES SHAPE</span></Item>}
      {beat >= 3 && <Item key="card1" name="card1" className="step-card"><small>01 / THE IDEA</small><strong>Every beat</strong><span>title · caption · visual</span></Item>}
      {beat >= 4 && <Item key="card2" name="card2" className={`step-card ${beat >= 8 ? 'edited' : ''}`}><small>02 / THE DETAIL</small><strong>Another beat</strong><span>title · caption · visual</span>{beat >= 8 && <em>edited in place ↺</em>}</Item>}
      {beat >= 4 && <Item key="card3" name="card3" className="step-card"><small>03 / THE PAYOFF</small><strong>The next beat</strong><span>title · caption · visual</span></Item>}
      {beat >= 3 && <Item key="morph1" name="morph1" className="morph"><span>→</span><small>morph</small></Item>}
      {beat >= 4 && <Item key="morph2" name="morph2" className="morph"><span>→</span><small>morph</small></Item>}
      {beat >= 5 && <Item key="ghost" name="ghost" className="ghost"><span>···</span><small>your call</small></Item>}
      {beat >= 5 && <Item key="depth" name="depth" className="depth">partial <span>⟷</span> full</Item>}
      {beat >= 6 && <Item key="kit" name="kit" className="kit"><Layers size={15} /><span>drawn with the shared scene kit</span></Item>}
      {beat >= 7 && <Item key="verifyLink" name="verifyLink" className="verify-link">→</Item>}
      {beat >= 7 && <Item key="verify" name="verify" className="verify"><Check size={22} /><strong>verify</strong><span>build + render / pass</span></Item>}
      {beat >= 8 && <motion.svg key="modify" data-entity="modify" className="modify" width="880" height="380" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-label="Modify the existing step"><path d="M 660 120 C 820 144 800 185 318 194 L 318 209" /><text x="675" y="158">ask → edit → repeat</text></motion.svg>}
      {beat >= 9 && <Item key="reveal" name="reveal" className="reveal"><span>AND THIS IS THE OUTPUT. YOU'RE IN IT.</span></Item>}
    </AnimatePresence>
  </SceneLayer>
}

import { AnimatePresence, motion } from 'motion/react'
import { UserRound, Sparkles, Check, Blocks } from 'lucide-react'
import type { ReactNode, CSSProperties } from 'react'
import type { SceneProps } from '../../presentation-kit'
import { ENTER_T, LAYOUT_T } from '../../presentation-kit/constants'
import type { Payload } from './steps'
function Entity({ name, className = '', style, children }: { name: string; className?: string; style: CSSProperties; children: ReactNode }) {
  return <motion.div data-entity={name} layout layoutId={`how-to:${name}`} className={`entity ${className}`} style={{ position: 'absolute', ...style }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ ...ENTER_T, layout: LAYOUT_T }}>{children}</motion.div>
}
export function Conversation({ payload: { beat } }: SceneProps<Payload>) {
  return <div className="conversation"><AnimatePresence>
    <Entity key="you" name="you" className="person" style={{ left: 90, top: 43, width: 105 }}><UserRound size={27} /><strong>you</strong></Entity>
    <Entity key="prompt" name="prompt" className="prompt" style={{ left: 224, top: 45, width: 240 }}><span className="eyebrow">THE TOPIC</span><strong>“I have an idea…”</strong></Entity>
    {beat >= 2 && <Entity key="skill" name="skill" className="person skill" style={{ left: 644, top: 43, width: 120 }}><Sparkles size={27} /><strong>skill</strong></Entity>}
    {beat >= 2 && <Entity key="question" name="question" className="question" style={{ left: 482, top: 38, width: 144 }}><span>what happens next?</span><div className="conversation-arrow">↔</div></Entity>}
    {beat >= 3 && <Entity key="tray" name="tray" className="tray" style={{ left: 65, top: 163, width: 750, height: 132 }}><span>YOUR STORY / ONE EVOLVING SCENE</span></Entity>}
    {[1, 2, 3].filter(n => beat >= (n === 1 ? 3 : 4)).map((n) => <Entity key={`card-${n}`} name={`card-${n}`} className={`step-card ${beat >= 8 && n === 2 ? 'edited' : ''}`} style={{ left: 82 + (n - 1) * 168, top: 193, width: 130, height: 83 }}><span className="eyebrow">0{n} {beat >= 8 && n === 2 ? '↻ EDITED' : '/ STEP'}</span><strong>{['The idea', 'The shift', 'The payoff'][n - 1]}</strong><small>title · caption · visual</small></Entity>)}
    {beat >= 4 && [1,2].map(n => <Entity key={`morph-${n}`} name={`morph-${n}`} className="morph" style={{ left: 214 + (n - 1) * 168, top: 220, width: 34 }}><span>morph</span>→</Entity>)}
    {beat >= 5 && <Entity key="ghost" name="ghost" className="ghost" style={{ left: 586, top: 193, width: 66, height: 83 }}>…<small>your call</small></Entity>}
    {beat >= 5 && <Entity key="depth" name="depth" className="depth" style={{ left: 83, top: 120, width: 134 }}>partial ↔ full</Entity>}
    {beat >= 6 && <Entity key="kit" name="kit" className="kit" style={{ left: 290, top: 289, width: 260 }}><Blocks size={18} /> shared scene kit <small>boxes · arrows · motion</small></Entity>}
    {beat >= 7 && <Entity key="verify" name="verify" className="verify" style={{ left: 682, top: 193, width: 113, height: 83 }}><Check size={23} /><strong>verify</strong><small>build + render</small></Entity>}
    {beat >= 7 && <Entity key="verify-link" name="verify-link" className="verify-link" style={{ left: 655, top: 222 }}>→</Entity>}
    {beat >= 8 && <Entity key="modify" name="modify" className="modify" style={{ left: 337, top: 125, width: 364, height: 58 }}><span>↶ ask for a change</span></Entity>}
    {beat >= 9 && <Entity key="reveal" name="reveal" className="reveal" style={{ left: 27, top: 14, width: 825, height: 347 }}><span>AND THIS IS THE PRESENTATION.</span></Entity>}
  </AnimatePresence></div>
}

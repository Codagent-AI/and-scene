import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
import { ArrowLeftRight, Check, Layers, MessageCircle, Sparkles, UserRound } from 'lucide-react'
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { entities } from '../entities'
import { Box } from '../../../presentation-kit/nodes/Box'
import { ENTER_DELAY, ENTER_T } from '../../../presentation-kit/constants'

export const TITLE = 'How to Use This Skill to Make a Presentation'
export const outline = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

function Entity({ id, className = '', style, children }: { id: string; className?: string; style: CSSProperties; children?: ReactNode }) {
  return <Box id={entities[id]} data-scene-entity={id} className={`scene-entity ${className}`} style={style}>{children}</Box>
}

function VerificationResult() {
  const [passed, setPassed] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setPassed(true), (ENTER_DELAY + ENTER_T) * 1000)
    return () => window.clearTimeout(timer)
  }, [])
  return <><span data-verify-status={passed ? 'passed' : 'checking'} aria-label={passed ? 'Verification passed' : 'Checking build and render'}>{passed ? <Check size={19} /> : '…'}</span><strong>verify</strong><span>build ✓</span><span>render ✓</span></>
}

export function ReferenceScene({ payload: { beat } }: SceneProps<{ beat: number }>) {
  return <div className="reference-scene" data-reference-beat={beat}>
    <AnimatePresence>
      <Entity key="you" id="you" className="actor you" style={{ left: 145, top: 70, width: 110, height: 64 }}><UserRound size={20} /><strong>you</strong></Entity>
      <Entity key="prompt" id="prompt" className="prompt" style={{ left: 140, top: 24, width: 145, height: 30 }}><MessageCircle size={13} /> I have a topic…</Entity>
      {beat >= 2 && <Entity key="skill" id="skill" className="actor skill" style={{ left: 595, top: 70, width: 120, height: 64 }}><Sparkles size={20} /><strong>skill</strong></Entity>}
      {beat >= 2 && <Entity key="conversation" id="conversation" className="conversation" style={{ left: 275, top: 88, width: 300, height: 28 }}><span>←</span><i /><span>→</span></Entity>}
      {beat >= 2 && <Entity key="question" id="question" className="question" style={{ left: 345, top: 43, width: 170, height: 31 }}>one question at a time</Entity>}
      {beat >= 3 && <Entity key="tray" id="tray" className="tray" style={{ left: 126, top: 189, width: 638, height: 115 }} />}
      {[1, 2, 3].map((card) => beat >= (card === 1 ? 3 : 4) && <Entity key={`card-${card}`} id={`card-${card}`} className={`step-card ${beat >= 8 && card === 2 ? 'edited' : ''}`} style={{ left: 145 + (card - 1) * 135, top: 204, width: 106, height: 86 }}>
        <div className="card-heading"><span>0{card}</span><strong>{card === 1 ? 'the opening' : card === 2 ? 'the idea' : 'the payoff'}</strong></div>
        <div className="card-parts"><span>title</span><span>caption</span><span>visual</span></div>
        {beat >= 8 && card === 2 && <b className="edit-flag">edited</b>}
      </Entity>)}
      {[1, 2].map(link => beat >= 4 && <Entity key={`morph-${link}`} id={`morph-${link}`} className="morph-link" style={{ left: 252 + (link - 1) * 135, top: 228, width: 27, height: 32 }}><span>→</span><small>morph</small></Entity>)}
      {beat >= 5 && <Entity key="ghost" id="ghost" className="ghost-card" style={{ left: 550, top: 204, width: 106, height: 86 }}><span>…</span><small>your next beat</small></Entity>}
      {beat >= 5 && <Entity key="depth" id="depth" className="depth" style={{ left: 142, top: 143, width: 150, height: 26 }}><span>partial</span><ArrowLeftRight size={12} /><span>full</span></Entity>}
      {beat >= 6 && <Entity key="kit" id="kit" className="kit-socket" style={{ left: 295, top: 304, width: 220, height: 34 }}><Layers size={16} /><span>shared scene kit</span><small>boxes · arrows · motion</small></Entity>}
      {beat >= 7 && <Entity key="verify" id="verify" className="verify" style={{ left: 685, top: 204, width: 66, height: 86 }}><VerificationResult /></Entity>}
      {beat >= 7 && <Entity key="verify-link" id="verify-link" className="verify-link" style={{ left: 659, top: 230, width: 24, height: 25 }}>→</Entity>}
      {beat >= 8 && <Entity key="modify" id="modify" className="modify" style={{ left: 320, top: 135, width: 340, height: 67 }}><svg width="340" height="67" viewBox="0 0 340 67" aria-label="Modify arc from conversation to the second step"><path d="M 325 0 Q 325 33 158 33 Q 22 33 22 65" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" /><path d="m 18 58 4 7 4-7" fill="none" stroke="currentColor" /></svg><span>edit in place</span></Entity>}
      {beat >= 9 && <Entity key="reveal" id="reveal" className="reveal-frame" style={{ left: 105, top: 5, width: 680, height: 365 }}><span>THIS IS ONE OF THOSE PRESENTATIONS</span></Entity>}
    </AnimatePresence>
  </div>
}

export const STEPS: readonly Step<{ beat: number }>[] = outline.map(([era, title, caption], index) => ({
  id: `reference-${index + 1}`, era, title, caption, Scene: ReferenceScene,
  groupKey: 'reference-conversation', payload: { beat: index + 1 },
}))

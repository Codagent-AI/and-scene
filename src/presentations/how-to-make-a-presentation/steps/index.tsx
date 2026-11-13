import { AnimatePresence } from 'motion/react'
import { UserRound, Sparkles, Blocks, Check } from 'lucide-react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Label } from '../../../presentation-kit/nodes/Label'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { entity, positions } from '../entities'
export interface SamplePayload { beat: number }
function geometry(name: keyof typeof positions) {
 const [left,top,width,height]=positions[name]
 return {left,top,width,height}
}
function Card({number}:{number:1|2|3}) {
 return <Box id={entity(`card-${number}`)} className="step-card" style={geometry(`card-${number}`)}><span className="card-index">0{number}</span><strong>{['The opening','The change','The payoff'][number-1]}</strong><span>title · caption · visual</span></Box>
}
export function SampleScene({ payload: { beat } }: SceneProps<SamplePayload>) {
 return <SceneLayer className="sample-scene"><AnimatePresence>
  <Appear key="you"><Box id={entity('you')} className="person" Icon={UserRound} style={geometry('you')}>you</Box><Label id={entity('prompt')} className="prompt" style={geometry('prompt')}>a topic, an idea…</Label></Appear>
  {beat>=2 && <Appear key="conversation"><Box id={entity('skill')} Icon={Sparkles} className="skill-node" style={geometry('skill')}>the skill</Box><Arrow id={entity('conversation')} className="conversation-arrow" viewBox="0 0 880 380" d="M 185 72 L 610 72" both /><SymbolChip id={entity('question')} className="question" style={geometry('question')}>one question at a time</SymbolChip></Appear>}
  {beat>=3 && <Appear key="first"><Box id={entity('tray')} className="tray" style={geometry('tray')} aria-label="Step card tray" /><Card number={1}/></Appear>}
  {beat>=4 && <Appear key="more"><Card number={2}/><Card number={3}/><Label id={entity('morph-1')} className="morph" style={geometry('morph-1')}>→ morph</Label><Label id={entity('morph-2')} className="morph" style={geometry('morph-2')}>→ morph</Label></Appear>}
  {beat>=5 && <Appear key="depth"><Box id={entity('ghost')} className="ghost-card" style={geometry('ghost')}>your next beat ＋</Box><SymbolChip id={entity('depth')} className="depth" style={geometry('depth')}>partial ↔ full</SymbolChip></Appear>}
  {beat>=6 && <Appear key="kit"><Box id={entity('kit')} Icon={Blocks} className="kit-socket" style={geometry('kit')}>shared scene kit</Box></Appear>}
  {beat>=7 && <Appear key="verify"><Arrow id={entity('verify-link')} className="conversation-arrow" viewBox="0 0 880 380" d="M 625 225 L 648 225" /><Box id={entity('verify')} Icon={Check} className="verify-node" style={geometry('verify')}><strong>verify</strong><span>build + render ✓</span></Box></Appear>}
  {beat>=8 && <Appear key="modify"><Arrow id={entity('modify')} className="modify-arrow" viewBox="0 0 880 380" d="M 702 114 C 826 118 827 327 588 329 Q 549 329 549 260" /><Label id={entity('edited')} className="edited" style={geometry('edited')}>edited in place ↙</Label></Appear>}
  {beat>=9 && <Appear key="reveal"><Frame id={entity('reveal')} className="reveal-frame" style={geometry('reveal')}><span>You’re looking at one</span></Frame></Appear>}
 </AnimatePresence></SceneLayer>
}
const narrative = [
 ['the ask','You have a topic','It starts with you, a topic, and mild overconfidence.'],
 ['the ask','The skill interviews you','One question at a time: the topic, the look, then each beat of the story.'],
 ['the gathering','Answers become steps','Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
 ['the gathering','The deck grows','Same shapes, new beats. Every answer extends the story without redrawing it.'],
 ['the gathering','You set the depth','Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
 ['the build','It assembles the scene','Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
 ['the build','It checks its own work','Before saying done, it builds and renders every step — and fixes what breaks.'],
 ['the loop','Changed your mind? Loop it.','Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
 ['the reveal',"You're looking at one",'This presentation was built exactly this way. Thanks for watching.'],
]
export const STEPS: Step<SamplePayload>[] = narrative.map(([era,title,caption],i)=>({id:`beat-${i+1}`,era,title,caption,groupKey:'conversation',Scene:SampleScene,payload:{beat:i+1}}))

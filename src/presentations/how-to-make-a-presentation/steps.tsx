/* eslint-disable react-refresh/only-export-components */
import type { SceneProps, Step } from '../../presentation-kit/types'
import { Box } from '../../presentation-kit/nodes/Box'
import { Label } from '../../presentation-kit/nodes/Label'
import { Arrow } from '../../presentation-kit/nodes/Arrow'
import { Frame } from '../../presentation-kit/nodes/Frame'
import { SymbolChip } from '../../presentation-kit/nodes/SymbolChip'
import { SceneLayer } from '../../presentation-kit/nodes/SceneLayer'
import { ENTITY } from './entities'

type Payload = { through: number }
const titles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
const captions = [
  'It starts with you, a topic, and mild overconfidence.',
  'One question at a time: the topic, the look, then each beat of the story.',
  'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  'Same shapes, new beats. Every answer extends the story without redrawing it.',
  'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  'Before saying done, it builds and renders every step — and fixes what breaks.',
  'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  'This presentation was built exactly this way. Thanks for watching.',
]
const eras = ['the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering', 'the build', 'the build', 'the loop', 'the reveal']
function Scene({ payload }: SceneProps<Payload>) {
  const n = payload.through
  return <SceneLayer className="story">
    <Box id={ENTITY.you} className="person you" style={{ left: 92, top: 46 }}>YOU</Box>
    <Box id={ENTITY.prompt} className="prompt" style={{ left: 222, top: 52 }}>“I have a topic…”</Box>
    {n >= 1 && <><Box id={ENTITY.skill} className="person skill" style={{ left: 633, top: 46 }}>SKILL</Box><Arrow id="how-to-conversation" className="conversation" style={{ left: 300, top: 114, width: 310 }}>↔</Arrow><SymbolChip id={ENTITY.question} className="question" style={{ left: 408, top: 22 }}>one question at a time</SymbolChip></>}
    {n >= 2 && <><Box id={ENTITY.tray} className="tray" style={{ left: 70, top: 152, width: 740, height: 178 }} /><StepCard id={ENTITY.step1} num="01" title="Topic" style={{ left: 94, top: 178 }} /><Label id="how-to-morph-one" className="morph" style={{ left: 282, top: 228 }}>morph →</Label></>}
    {n >= 3 && <><StepCard id={ENTITY.step2} num="02" title="Visual style" style={{ left: 358, top: 178 }} /><Label id="how-to-morph-two" className="morph" style={{ left: 546, top: 228 }}>morph →</Label><StepCard id={ENTITY.step3} num="03" title="Story beats" style={{ left: 622, top: 178 }} /></>}
    {n >= 4 && <><Box id={ENTITY.ghost} className="step-card ghost" style={{ left: 94, top: 286 }}>… more</Box><SymbolChip id={ENTITY.depth} className="depth" style={{ left: 72, top: 105 }}>partial ↔ full · your call</SymbolChip></>}
    {n >= 5 && <><Box id={ENTITY.kit} className="kit" style={{ left: 350, top: 328 }}>SCENE KIT · boxes · arrows · motion</Box><Arrow id="how-to-kit-plug" className="plug" style={{ left: 454, top: 306 }}>↓</Arrow></>}
    {n >= 6 && <><Box id={ENTITY.verify} className="verify" style={{ left: 680, top: 286 }}>✓ BUILD + RENDER PASS</Box><Arrow id="how-to-verify-chain" className="chain" style={{ left: 740, top: 268 }}>↓</Arrow></>}
    {n >= 7 && <><Arrow id={ENTITY.modify} className="modify" style={{ left: 270, top: 122 }}>↘</Arrow><SymbolChip id="how-to-edited" className="edited" style={{ left: 330, top: 156 }}>EDITED</SymbolChip></>}
    {n >= 8 && <Frame id={ENTITY.reveal} className="reveal" style={{ inset: 8 }}>A PRESENTATION MADE WITH THE SKILL</Frame>}
  </SceneLayer>
}
function StepCard({ id, num, title, style }: { id: string; num: string; title: string; style: React.CSSProperties }) {
  return <Box id={id} className="step-card" style={style}><small>{num} / STEP</small><strong>{title}</strong><span>title · caption · visual</span></Box>
}
export const STEPS: Step<Payload>[] = titles.map((title, index) => ({ id: `step-${index + 1}`, era: eras[index], title, caption: captions[index], payload: { through: index }, Scene, groupKey: 'how-to-story' }))

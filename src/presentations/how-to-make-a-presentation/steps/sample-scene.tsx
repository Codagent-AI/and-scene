/* eslint-disable react-refresh/only-export-components -- exports the step data alongside its private scene renderer. */
import { AnimatePresence } from 'motion/react'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Emphasis } from '../../../presentation-kit/nodes/Emphasis'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { Label } from '../../../presentation-kit/nodes/Label'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip'
import type { Scene, Step } from '../../../presentation-kit/types'

interface SamplePayload { entities: string[]; cards: number; showSkill: boolean; showQuestion: boolean; showDepth: boolean; showKit: boolean; showVerify: boolean; showModify: boolean; reveal: boolean }

const scenes: SamplePayload[] = [
  { entities: ['you', 'prompt'], cards: 0, showSkill: false, showQuestion: false, showDepth: false, showKit: false, showVerify: false, showModify: false, reveal: false },
  { entities: ['you', 'prompt', 'skill', 'conversation-link', 'question-chip'], cards: 0, showSkill: true, showQuestion: true, showDepth: false, showKit: false, showVerify: false, showModify: false, reveal: false },
  { entities: ['you', 'prompt', 'skill', 'conversation-link', 'question-chip', 'step-card-1'], cards: 1, showSkill: true, showQuestion: true, showDepth: false, showKit: false, showVerify: false, showModify: false, reveal: false },
  { entities: ['you', 'prompt', 'skill', 'conversation-link', 'question-chip', 'step-card-1', 'step-card-2', 'step-card-3'], cards: 3, showSkill: true, showQuestion: true, showDepth: false, showKit: false, showVerify: false, showModify: false, reveal: false },
  { entities: ['you', 'prompt', 'skill', 'conversation-link', 'question-chip', 'step-card-1', 'step-card-2', 'step-card-3', 'step-card-4', 'step-card-5', 'ghost-card', 'depth-control'], cards: 5, showSkill: true, showQuestion: true, showDepth: true, showKit: false, showVerify: false, showModify: false, reveal: false },
  { entities: ['you', 'prompt', 'skill', 'conversation-link', 'question-chip', 'step-card-1', 'step-card-2', 'step-card-3', 'step-card-4', 'step-card-5', 'ghost-card', 'depth-control', 'scene-kit'], cards: 5, showSkill: true, showQuestion: true, showDepth: true, showKit: true, showVerify: false, showModify: false, reveal: false },
  { entities: ['you', 'prompt', 'skill', 'conversation-link', 'question-chip', 'step-card-1', 'step-card-2', 'step-card-3', 'step-card-4', 'step-card-5', 'ghost-card', 'depth-control', 'scene-kit', 'verify'], cards: 5, showSkill: true, showQuestion: true, showDepth: true, showKit: true, showVerify: true, showModify: false, reveal: false },
  { entities: ['you', 'prompt', 'skill', 'conversation-link', 'question-chip', 'step-card-1', 'step-card-2', 'step-card-3', 'step-card-4', 'step-card-5', 'ghost-card', 'depth-control', 'scene-kit', 'verify', 'modify', 'edited-card'], cards: 5, showSkill: true, showQuestion: true, showDepth: true, showKit: true, showVerify: true, showModify: true, reveal: false },
  { entities: ['you', 'prompt', 'skill', 'conversation-link', 'question-chip', 'step-card-1', 'step-card-2', 'step-card-3', 'step-card-4', 'step-card-5', 'ghost-card', 'depth-control', 'scene-kit', 'verify', 'modify', 'edited-card', 'outer-frame'], cards: 5, showSkill: true, showQuestion: true, showDepth: true, showKit: true, showVerify: true, showModify: true, reveal: true },
]

function New({ show, children }: { show: boolean; children: React.ReactNode }) {
  return show ? <Appear>{children}</Appear> : null
}

const SampleScene: Scene<SamplePayload> = ({ payload }) => <SceneLayer className="sample-scene">
  <Label id="you" className="person" style={{ left: 42, top: 34 }}><span className="eyebrow">YOU</span><strong>You</strong></Label>
  <Box id="prompt" className="prompt" style={{ left: 42, top: 112 }}><span>“I have a topic…”</span><i>topic</i></Box>
  <New show={payload.showSkill}><>
    <Arrow id="conversation-link" className="conversation-link" style={{ left: 167, top: 53 }}><span>↔</span></Arrow>
    <Box id="skill" className="person skill" style={{ left: 330, top: 34 }}><span className="eyebrow">AND SCENE</span><strong>Skill</strong></Box>
    <New show={payload.showQuestion}><SymbolChip id="question-chip" className="question-chip" style={{ left: 211, top: 21 }}>one question</SymbolChip></New>
  </></New>
  {payload.cards > 0 && <div className="tray" data-presentation-allow-overlap="true">
    <div className="tray-label">YOUR STORY · STEP CARDS</div>
    {Array.from({ length: payload.cards }, (_, i) => {
      const id = `step-card-${i + 1}`
      return <New key={id} show={true}><Box id={id} className={`step-card ${payload.showModify && i === 2 ? 'edited' : ''}`} style={{ left: 34 + i * 118, top: 218 }}>
        <span className="card-number">0{i + 1}</span><strong>{i === 0 ? 'Title' : i === 1 ? 'Caption' : i === 2 ? 'Visual' : `Beat ${i + 1}`}</strong>
        {i === 0 && <span className="card-detail">caption · visual</span>}
        <span className="mini-line"/><span className="mini-block"/>
      </Box></New>
    })}
    {payload.cards > 1 && <div className="morph-link" style={{ left: 145, top: 266 }}>↝ <small>morph</small></div>}
    {payload.cards > 2 && <div className="morph-link second" style={{ left: 381, top: 266 }}>↝ <small>morph</small></div>}
    <New show={payload.showVerify}><Box id="verify" className="verify" style={{ left: 652, top: 218 }}><span>BUILD + RENDER</span><strong>✓ PASS</strong></Box></New>
    <AnimatePresence>
      {payload.showDepth && !payload.showVerify && <Appear key="ghost-card"><Box id="ghost-card" className="step-card ghost-card" style={{ left: 624, top: 218 }}><span className="card-number">··</span><strong>Open slot</strong><span className="mini-line"/><span className="mini-block"/></Box></Appear>}
    </AnimatePresence>
    <New show={payload.showDepth}><SymbolChip id="depth-control" className="depth-control" style={{ left: 42, top: 87 }}>partial ↔ full</SymbolChip></New>
  </div>}
  <New show={payload.showKit}><>
    <div className="socket-stem"/>
    <Box id="scene-kit" className="scene-kit" style={{ left: 338, top: 326 }}><span>SHARED SCENE KIT</span><strong>Boxes · arrows · motion</strong></Box>
  </></New>
  <New show={payload.showModify}><>
    <Arrow id="modify" className="modify-arc" style={{ left: 300, top: 126 }}>↘ <span>modify in place</span></Arrow>
    <Emphasis id="edited-card" className="edit-flag" style={{ left: 270, top: 202 }}>EDITED</Emphasis>
  </></New>
  <New show={payload.reveal}><div data-presentation-allow-overlap="true"><Frame id="outer-frame" className="reveal-frame" style={{ left: 12, top: 8 }}><span>BUILT WITH THE SKILL · THIS IS THE EXAMPLE</span></Frame></div></New>
</SceneLayer>

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
export const STEPS: Step<SamplePayload>[] = titles.map((title, index) => ({ id: `sample-${index + 1}`, era: eras[index], title, caption: captions[index], Scene: SampleScene, payload: scenes[index], groupKey: 'reference-sample' }))

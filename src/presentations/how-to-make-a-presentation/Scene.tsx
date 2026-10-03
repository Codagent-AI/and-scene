import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit/index.js'
import type { SceneProps } from '../../presentation-kit/index.js'
import type { Payload } from './steps.js'

const cards = [
  { name: 'TOPIC', hint: 'title · caption · visual' },
  { name: 'ASK', hint: 'one at a time' },
  { name: 'STEPS', hint: 'answer becomes a beat' },
  { name: 'DEPTH', hint: 'your call' },
  { name: 'SCENE', hint: 'shared kit' },
  { name: 'VERIFY', hint: 'build + render' },
  { name: 'REVISE', hint: 'change in place' },
]
const cardX = (index: number) => 39 + 112 * index

export function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer className="sample-scene">
    <div className="conversation-row">
      <Box id="sample:you" className="sample-person you" style={{ left: 64, top: 20 }}><span className="node-kicker">THE AUTHOR</span><strong>you</strong><small>one good topic</small></Box>
      <div className="prompt-bubble" data-entity-id="sample:prompt" style={{ left: 191, top: 29 }}>“I have an idea…”</div>
      {payload.question && <>
        <Arrow id="sample:conversation-link" className="conversation-arrow" style={{ left: 385, top: 45 }} />
        <SymbolChip id="sample:question-chip" className="question-chip" style={{ left: 415, top: 2 }}>ONE QUESTION AT A TIME</SymbolChip>
        <Box id="sample:skill" className="sample-person skill" style={{ left: 610, top: 20 }}><span className="node-kicker">YOUR GUIDE</span><strong>the skill</strong><small>listens, then draws</small></Box>
      </>}
    </div>
    {payload.cards > 0 && <>
      <div className="card-tray" data-entity-id="sample:card-tray" aria-label="Accumulating step cards">
        {cards.slice(0, payload.cards).map(({ name, hint }, index) => <Box key={name} id={`sample:card-${name.toLowerCase()}`} className={`step-card card-${index}`} style={{ left: cardX(index), top: 132 }}>
          <span className="card-number">0{index + 1}</span><strong>{name}</strong><small>{hint}</small>
        </Box>)}
        {payload.cards > 1 && <div className="card-links" aria-hidden="true">{cards.slice(0, payload.cards - 1).map((_, index) => <span key={index} style={{ left: cardX(index) + 92, top: 166 }}>→<small>morph</small></span>)}</div>}
        {payload.ghost && <Box id="sample:ghost-card" className="step-card ghost-card" style={{ left: cardX(payload.cards), top: 132 }}><span className="card-number">??</span><strong>YOUR BEAT</strong><small>still yours to shape</small></Box>}
        {payload.verify && <>
          <Arrow id="sample:verify-chain" className="verify-arrow" style={{ left: 806, top: 165 }} />
          <Box id="sample:verify" className="verify-node" style={{ left: 823, top: 132 }}><span>✓</span><strong>PASS</strong></Box>
        </>}
      </div>
      {payload.socket && <>
        <div className="socket-stem" />
        <Box id="sample:scene-kit" className="kit-socket" style={{ left: 354, top: 252 }}><span className="socket-glyph">◈</span><strong>SHARED SCENE KIT</strong><small>boxes · links · motion</small></Box>
      </>}
    </>}
    {payload.modify && <>
      <svg className="modify-arc" viewBox="0 0 880 380" aria-hidden="true"><path d="M708 86 C790 102 810 242 548 248" /></svg>
      <Emphasis id="sample:edited-card" className="edited-card" style={{ left: 483, top: 124, width: 108, height: 96 }} />
      <Label id="sample:edit-label" className="edit-label" style={{ left: 493, top: 224 }}>EDIT IN PLACE</Label>
    </>}
    {payload.reveal && <>
      <Frame id="sample:reveal-frame" className="reveal-frame" />
      <Label id="sample:reveal-label" className="reveal-label">A PRESENTATION, MADE BY ITS OWN SKILL</Label>
    </>}
  </SceneLayer>
}

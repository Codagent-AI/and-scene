import type { CSSProperties } from 'react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps, type Step } from '../../../presentation-kit'
import { entity } from '../entities'

interface SamplePayload { conversation: boolean; cards: number; ghost: boolean; control: boolean; kit: boolean; verify: boolean; modify: boolean; reveal: boolean }

const details = [
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
// What each accumulated step card says beneath its step title.
const cardDetails = ['topic · prompt · visual', 'one question at a time', 'title · caption · visual', 'same shapes, new beats', 'partial ↔ full', 'shared scene kit', 'build + render', 'edit in place', 'self-reference']
const cards = details.map(([, title], i) => ({ number: String(i + 1).padStart(2, '0'), title, detail: cardDetails[i] }))
const CARDS_PER_ROW = 3
const positions: CSSProperties[] = cards.map((_, i) => ({ left: 24 + (i % CARDS_PER_ROW) * 296, top: 116 + Math.floor(i / CARDS_PER_ROW) * 72 }))
// Morph links join consecutive cards that share a tray row.
const isRowEnd = (i: number) => i % CARDS_PER_ROW === CARDS_PER_ROW - 1

// The module also exports the step registry consumed by Talk.tsx.
// eslint-disable-next-line react-refresh/only-export-components
function Scene({ payload }: SceneProps<SamplePayload>) {
  return <SceneLayer className="sample-scene">
    <div className="conversation" data-allow-overlap="">
      <Box id={entity('you')} className="conversation-node you-node"><span className="eyebrow">THE AUTHOR</span><strong>you</strong></Box>
      {payload.conversation && <Box id={entity('skill')} className="conversation-node skill-node"><span className="eyebrow">THE GUIDE</span><strong>skill</strong></Box>}
      {payload.conversation && <Arrow id={entity('conversation-arrow')} className="conversation-arrow">↔</Arrow>}
      {payload.conversation && <SymbolChip id={entity('question-chip')} className="question-chip">one question at a time</SymbolChip>}
      <Label id={entity('prompt')} className="prompt-bubble">“I have a topic…”</Label>
    </div>

    {payload.cards > 0 && <div className="card-tray" aria-label="Accumulating presentation steps">
      {cards.slice(0, payload.cards).map(({ number, title, detail }, card) => <Box key={number} id={entity(`step-${number}`)} className={`step-card ${card === 4 && payload.control ? 'step-card--flagged' : ''}`} style={positions[card]}>
        <span className="card-number">{number}</span><strong>{title}</strong><small>{detail}</small>
        {card === 4 && payload.control && <Emphasis id={entity('partial-full-control')} className="partial-control" data-allow-overlap="">PARTIAL ↔ FULL</Emphasis>}
        {card === 6 && payload.verify && <span className="pass-check" aria-label="verification passed">✓</span>}
      </Box>)}
      {Array.from({ length: Math.max(0, payload.cards - 1) }, (_, card) => card).filter((card) => !isRowEnd(card)).map((card) => <Label key={`morph-${card}`} id={entity(`morph-${card + 1}`)} className="morph-link" style={{ left: 272 + (card % CARDS_PER_ROW) * 296, top: 140 + Math.floor(card / CARDS_PER_ROW) * 72 }}>morphs</Label>)}
      {payload.ghost && <div className="ghost-card" style={positions[Math.min(payload.cards, positions.length - 1)]}>… next beats</div>}
      {payload.kit && <div className="kit-socket"><span className="socket-line"/><SymbolChip id={entity('kit-socket')} className="kit-chip">scene kit</SymbolChip></div>}
      {payload.verify && <Arrow id={entity('verify-chain')} className="verify-chain">→</Arrow>}
    </div>}

    {payload.modify && <>
      <svg className="modify-arc" viewBox="0 0 880 380" aria-hidden="true"><path d="M 126 88 C 92 112, 56 116, 40 143" /></svg>
      <Label id={entity('modify-label')} className="modify-label">EDIT IN PLACE</Label>
    </>}
    {payload.reveal && <Frame id={entity('reveal-frame')} className="reveal-frame" data-allow-overlap=""><span>BUILT WITH THE SAME SKILL</span></Frame>}
  </SceneLayer>
}

const states: SamplePayload[] = [
  { conversation: false, cards: 0, ghost: false, control: false, kit: false, verify: false, modify: false, reveal: false },
  { conversation: true, cards: 0, ghost: false, control: false, kit: false, verify: false, modify: false, reveal: false },
  { conversation: true, cards: 1, ghost: false, control: false, kit: false, verify: false, modify: false, reveal: false },
  { conversation: true, cards: 4, ghost: false, control: false, kit: false, verify: false, modify: false, reveal: false },
  { conversation: true, cards: 5, ghost: true, control: true, kit: false, verify: false, modify: false, reveal: false },
  { conversation: true, cards: 6, ghost: false, control: true, kit: true, verify: false, modify: false, reveal: false },
  { conversation: true, cards: 7, ghost: false, control: true, kit: true, verify: true, modify: false, reveal: false },
  { conversation: true, cards: 8, ghost: false, control: true, kit: true, verify: true, modify: true, reveal: false },
  { conversation: true, cards: 9, ghost: false, control: true, kit: true, verify: true, modify: true, reveal: true },
]

export const steps: Step<SamplePayload>[] = details.map(([era, title, caption], index) => ({ id: `step-${index + 1}`, era, title, caption, Scene, payload: states[index], groupKey: 'evolving-sample' }))

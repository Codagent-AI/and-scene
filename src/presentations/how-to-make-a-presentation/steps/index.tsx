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
// The deck the viewer builds: its first beats land as cards in one tray row,
// followed by the ghost card for unspecified beats and the chained verify node.
const cardDetails = ['topic · prompt · visual', 'one question at a time', 'title · caption · visual', 'same shapes, new beats']
const cards = cardDetails.map((detail, i) => ({ number: String(i + 1).padStart(2, '0'), title: details[i][1], detail }))
const EDITED_CARD = 1

/** Tray geometry on the 880 × 380 design canvas. */
export const layout = { trayTop: 176, cardWidth: 112, cardGap: 44, trayLeft: 34, ghostGap: 16, ghostWidth: 96, chainWidth: 32, verifyWidth: 88 } as const
const cardLeft = (i: number) => layout.trayLeft + i * (layout.cardWidth + layout.cardGap)
const ghostLeft = cardLeft(cards.length - 1) + layout.cardWidth + layout.ghostGap
const chainLeft = ghostLeft + layout.ghostWidth
const verifyLeft = chainLeft + layout.chainWidth
const at = (left: number): CSSProperties => ({ left, top: layout.trayTop })
// The modify arc runs from "you" down to the top edge of the edited card.
const editedCardCenter = cardLeft(EDITED_CARD) + layout.cardWidth / 2
const modifyArc = `M 300 106 C 300 140, ${editedCardCenter} 146, ${editedCardCenter} ${layout.trayTop}`

// The module also exports the step registry consumed by Talk.tsx.
// eslint-disable-next-line react-refresh/only-export-components
function Scene({ payload }: SceneProps<SamplePayload>) {
  return <SceneLayer className="sample-scene">
    <div className="conversation" data-allow-overlap="">
      <Box id={entity('you')} className="conversation-node you-node">
        <span className="eyebrow">THE AUTHOR</span><strong>you</strong>
        {payload.control && <Emphasis id={entity('partial-full-control')} className="partial-control">PARTIAL ↔ FULL</Emphasis>}
      </Box>
      {payload.conversation && <Box id={entity('skill')} className="conversation-node skill-node"><span className="eyebrow">THE GUIDE</span><strong>skill</strong></Box>}
      {payload.conversation && <Arrow id={entity('conversation-arrow')} className="conversation-arrow">↔</Arrow>}
      {payload.conversation && <SymbolChip id={entity('question-chip')} className="question-chip">one question at a time</SymbolChip>}
      <Label id={entity('prompt')} className="prompt-bubble">“I have a topic…”</Label>
    </div>

    {payload.cards > 0 && <div className="card-tray" aria-label="Accumulating presentation steps">
      {cards.slice(0, payload.cards).map(({ number, title, detail }, card) => {
        const edited = payload.modify && card === EDITED_CARD
        return <Box key={number} id={entity(`step-${number}`)} className={`step-card ${edited ? 'step-card--flagged' : ''}`} style={at(cardLeft(card))} data-allow-overlap={edited ? '' : undefined}>
          <span className="card-number">{number}</span><strong>{title}</strong><small>{detail}</small>
          {edited && <Emphasis id={entity('edited-flag')} className="edited-flag">EDITED</Emphasis>}
        </Box>
      })}
      {Array.from({ length: Math.max(0, payload.cards - 1) }, (_, card) => <Label key={`morph-${card}`} id={entity(`morph-${card + 1}`)} className="morph-link" style={{ left: cardLeft(card) + layout.cardWidth, top: layout.trayTop + 30, width: layout.cardGap }}>morphs</Label>)}
      {payload.ghost && <div className="ghost-card" style={at(ghostLeft)}>… next beats</div>}
      {payload.verify && <>
        <Arrow id={entity('verify-chain')} className="verify-chain" style={{ left: chainLeft, top: layout.trayTop + 24, width: layout.chainWidth }}>→</Arrow>
        <Box id={entity('verify')} className="verify-node" style={at(verifyLeft)}>
          <strong>verify</strong><small>build · render</small>
          <span className="pass-check" aria-label="verification passed">✓</span>
        </Box>
      </>}
      {payload.kit && <div className="kit-socket"><span className="socket-line"/><SymbolChip id={entity('kit-socket')} className="kit-chip">scene kit</SymbolChip></div>}
    </div>}

    {payload.modify && <>
      <svg className="modify-arc" viewBox="0 0 880 380" aria-hidden="true"><path d={modifyArc} /></svg>
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
  { conversation: true, cards: 4, ghost: true, control: true, kit: false, verify: false, modify: false, reveal: false },
  { conversation: true, cards: 4, ghost: true, control: true, kit: true, verify: false, modify: false, reveal: false },
  { conversation: true, cards: 4, ghost: true, control: true, kit: true, verify: true, modify: false, reveal: false },
  { conversation: true, cards: 4, ghost: true, control: true, kit: true, verify: true, modify: true, reveal: false },
  { conversation: true, cards: 4, ghost: true, control: true, kit: true, verify: true, modify: true, reveal: true },
]

export const steps: Step<SamplePayload>[] = details.map(([era, title, caption], index) => ({ id: `step-${index + 1}`, era, title, caption, Scene, payload: states[index], groupKey: 'evolving-sample' }))

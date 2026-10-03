/* eslint-disable react-refresh/only-export-components */
import type { CSSProperties } from 'react'
import { Arrow, Box, Frame, Label, SymbolChip, type Step } from '../../../presentation-kit'
import outline from '../outline.json'
import { ENTITY } from '../entities'

type Payload = { through: number }
const cardPositions = [
  [26, 190], [166, 190], [306, 190], [446, 190], [586, 190],
] as const
const cardCopy = [
  ['TITLE', 'A clear beat'], ['CAPTION', 'Why it matters'], ['VISUAL', 'What we see'],
  ['MORPH', 'What changes'], ['SCENE', 'One shared world'],
]

function Scene({ payload }: { payload: Payload }) {
  const through = payload.through
  return <div className="sample-scene" data-sample-scene="">
    <div className="conversation">
      <Box entityId={ENTITY.you} className="person"><span className="node-kicker">YOU</span><strong>your idea</strong></Box>
      {through >= 1 && <Arrow entityId={ENTITY.conversation} className="conversation-arrow" />}
      {through >= 1 && <Box entityId={ENTITY.skill} className="skill"><span className="node-kicker">THE SKILL</span><strong>asks · draws · checks</strong></Box>}
      <SymbolChip entityId={ENTITY.prompt} className="prompt">a topic</SymbolChip>
      {through >= 1 && <SymbolChip entityId={ENTITY.question} className="question">one question at a time</SymbolChip>}
    </div>
    {through >= 2 && <div className="card-rail" aria-label="Accumulating step cards">
      {cardPositions.map(([left, top], index) => index < through - 1 && <Box key={ENTITY.cards[index]} entityId={ENTITY.cards[index]} className={`step-card card-${index + 1}`} style={{ left, top } as CSSProperties}>
        <span className="card-number">0{index + 1}</span><strong>{cardCopy[index][0]}</strong><span>{cardCopy[index][1]}</span>
      </Box>)}
      {through >= 3 && <svg className="morph-links" viewBox="0 0 840 380" aria-hidden="true"><path d="M152 236H164 M292 236H304 M432 236H444 M572 236H584" /></svg>}
    </div>}
    {through >= 4 && <>
      <SymbolChip entityId={ENTITY.ghost} className="ghost-card">+ your next beat</SymbolChip>
      <div className="depth-control" data-allow-overlap=""><span>you choose</span><b>sketch ↔ detail</b></div>
    </>}
    {through >= 5 && <>
      <Arrow entityId={ENTITY.kitConnector} className="kit-connector" />
      <Box entityId={ENTITY.kit} className="kit-socket"><span className="node-kicker">SHARED KIT</span><strong>scene kit</strong><span>boxes · arrows · motion</span></Box>
    </>}
    {through >= 6 && <>
      <Arrow entityId={ENTITY.verifyConnector} className="verify-connector" />
      <Box entityId={ENTITY.verify} className="verify-node"><span className="node-kicker">VERIFY</span><strong>checks</strong><span className="pass-mark">✓ PASS</span></Box>
    </>}
    {through >= 7 && <>
      <svg className="modify-arc" viewBox="0 0 880 380" aria-hidden="true"><path d="M440 130 C440 154 400 168 370 190" /></svg>
      <Label entityId={ENTITY.modify} className="modify-label">edit in place</Label>
      <div className="edited-flag">EDITED</div>
    </>}
    {through >= 8 && <Frame entityId={ENTITY.reveal} className="reveal-frame" data-allow-overlap=""><span>SELF-REFERENCE · BUILT WITH THE SKILL</span></Frame>}
  </div>
}

export const STEPS: Step<Payload>[] = outline.map((item, index) => ({
  ...item, groupKey: 'how-to-evolving-scene', Scene, payload: { through: index },
}))

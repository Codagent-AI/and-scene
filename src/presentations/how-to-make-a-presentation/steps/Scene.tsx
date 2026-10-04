import type { CSSProperties } from 'react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit'
import { ENTITY as E } from '../entities'

type Payload = { beat: number }
const place = (left: number, top: number, width?: number): CSSProperties => ({ position: 'absolute', left, top, width })
const card = (id: string, n: number, label: string, left: number) => <Box id={id} className="story-card" style={place(left, 215, 116)}><span className="story-card-number">0{n}</span><Label id={`${id}:label`}>{label}</Label></Box>

function Scene({ payload: { beat } }: SceneProps<Payload>) {
  return <SceneLayer className="story-scene">
    <Box id={E.you} className="person-node you-node" style={place(178, 22, 144)}><span className="node-kicker">YOU</span><Label id={`${E.you}:label`}>A topic</Label></Box>
    {beat >= 1 && <SymbolChip id={E.prompt} className="prompt-chip" style={place(20, 48)}>“I have an idea…”</SymbolChip>}
    {beat >= 2 && <>
      <Box id={E.skill} className="person-node skill-node" style={place(558, 22, 144)}><span className="node-kicker">THE SKILL</span><Label id={`${E.skill}:label`}>One question</Label></Box>
      <Arrow id={E.conversation} className="conversation-arrow" style={place(336, 69, 214)}><span>↔</span></Arrow>
      <SymbolChip id={E.question} className="question-chip" style={place(397, 15)}>topic · look · beats</SymbolChip>
    </>}
    {beat >= 3 && <>
      <div className="tray-label" style={place(25, 181)}>YOUR STORY, TAKING SHAPE</div>
      {card(E.card1, 1, 'Title · caption · visual', 25)}
      <Arrow id="how-to:link-1" className="card-link" style={place(143, 251, 25)}>→</Arrow>
      <div className="morph-note" style={place(136, 277, 40)}>morph</div>
    </>}
    {beat >= 4 && <>
      {card(E.card2, 2, 'A new beat', 178)}
      <Arrow id="how-to:link-2" className="card-link" style={place(296, 251, 25)}>→</Arrow>
      {card(E.card3, 3, 'And another', 331)}
      <Arrow id="how-to:link-3" className="card-link" style={place(449, 251, 25)}>→</Arrow>
    </>}
    {beat >= 5 && <>
      <Box id={E.ghost} className="story-card ghost-card" style={place(484, 215, 116)}><span className="ghost-question">?</span><Label id={`${E.ghost}:label`}>Your next beat</Label></Box>
      <Emphasis id={E.depth} className="depth-control" style={place(186, 115, 146)}><span>YOU CHOOSE</span><b>sketch ↔ detail</b></Emphasis>
    </>}
    {beat >= 6 && <>
      <SymbolChip id={E.kit} className="kit-socket" style={place(489, 316, 195)}>◉ &nbsp; SHARED SCENE KIT</SymbolChip>
      <span className="plug-line" style={place(558, 293, 2)} />
    </>}
    {beat >= 7 && <>
      {<Box id="how-to:card-4" className="story-card story-card-edited" style={place(637, 215, 116)}><span className="story-card-number">04</span><Label id="how-to:card-4:label">A revision</Label><span className="edited-flag">edited</span></Box>}
      <Arrow id="how-to:verify-link" className="card-link" style={place(755, 251, 25)}>→</Arrow>
      <Box id={E.verify} className="verify-node" style={place(786, 223, 80)}><span>BUILD + RENDER</span><b>✓ Ready</b></Box>
      <span className="check-note" style={place(787, 299)}>every step</span>
    </>}
    {beat >= 8 && <>
      <Frame id={E.modify} className="modify-arc" style={{ position: 'absolute', left: 305, top: 107, width: 318, height: 135 }}><span>ASK TO CHANGE</span></Frame>
      <Arrow id="how-to:modify-arrow" className="modify-arrow" style={place(417, 148, 170)}>↘ revise in place</Arrow>
      <span className="edited-dot" style={place(724, 211)}>↻</span>
    </>}
    {beat >= 9 && <div data-presentation-allow-overlap="intentional-reveal-frame"><Frame id={E.reveal} className="reveal-frame" style={place(9, 4, 862)}><span className="reveal-label">AN EXAMPLE, MADE BY THE SKILL</span></Frame></div>}
  </SceneLayer>
}

export default Scene

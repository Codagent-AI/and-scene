import { AnimatePresence } from 'motion/react'
import { UserRound, Sparkles, Component, Check } from 'lucide-react'
import { Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entities as e } from '../entities'

export interface Beat { beat: number }
export function ConversationScene({ payload: { beat } }: SceneProps<Beat>) {
  return <SceneLayer className="sample-scene" aria-label="A conversation grows into a presentation">
    <AnimatePresence>
      <Box key={e.you} id={e.you} Icon={UserRound} className="actor you" style={{ left: 180, top: 45, width: 110, height: 58 }}>you</Box>
      <Label key={e.prompt} id={e.prompt} className="prompt" style={{ left: 42, top: 48, width: 118, height: 50 }}>“I have a topic…”</Label>
      {beat >= 2 && <Box key={e.skill} id={e.skill} Icon={Sparkles} className="actor skill" style={{ left: 576, top: 45, width: 128, height: 58 }}>skill</Box>}
      {beat >= 2 && <Arrow key={e.conversation} id={e.conversation} className="connector" d="M 304 75 L 559 75" bidirectional style={{ left: 0, top: 0, width: 880, height: 130 }} />}
      {beat >= 2 && <SymbolChip key={e.question} id={e.question} className="question" style={{ left: 342, top: 27, width: 181, height: 30 }}>one question at a time</SymbolChip>}
      {beat >= 3 && <Box key={e.tray} id={e.tray} className="tray" style={{ left: 30, top: 200, width: 820, height: 116 }} aria-label="Step tray" />}
      {beat >= 3 && <Box key={e.first} id={e.first} className="step-card" style={{ left: 48, top: 216, width: 132, height: 86 }}><span className="card-number">01</span><strong>The opening</strong><span>title · caption · visual</span></Box>}
      {beat >= 4 && <Box key={e.second} id={e.second} className="step-card" style={{ left: 234, top: 216, width: 132, height: 86 }}><span className="card-number">02</span><strong>The idea</strong><span>title · caption · visual</span></Box>}
      {beat >= 4 && <Box key={e.third} id={e.third} className="step-card" style={{ left: 420, top: 216, width: 132, height: 86 }}><span className="card-number">03</span><strong>The payoff</strong><span>title · caption · visual</span></Box>}
      {beat >= 4 && <Arrow key={e.link1} id={e.link1} className="connector" d="M 183 260 L 229 260" style={{ left: 0, top: 190, width: 880, height: 125 }} viewBox="0 190 880 125" />}
      {beat >= 4 && <Arrow key={e.link2} id={e.link2} className="connector" d="M 370 260 L 415 260" style={{ left: 0, top: 190, width: 880, height: 125 }} viewBox="0 190 880 125" />}
      {beat >= 4 && <Label key={e.morph1} id={e.morph1} className="morph-label" style={{ left: 184, top: 235, width: 44 }}>morph</Label>}
      {beat >= 4 && <Label key={e.morph2} id={e.morph2} className="morph-label" style={{ left: 370, top: 235, width: 44 }}>morph</Label>}
      {beat >= 5 && <Box key={e.ghost} id={e.ghost} className="ghost-card" style={{ left: 580, top: 216, width: 116, height: 86 }}><span>+ your next beat</span><small>as much as you need</small></Box>}
      {beat >= 5 && <SymbolChip key={e.depth} id={e.depth} className="depth" style={{ left: 180, top: 103, width: 110, height: 30 }}>partial ↔ full</SymbolChip>}
      {beat >= 6 && <Box key={e.kit} id={e.kit} Icon={Component} className="kit-socket" style={{ left: 310, top: 316, width: 260, height: 35 }}>shared scene kit · shapes + motion</Box>}
      {beat >= 7 && <Arrow key={e.verifyLink} id={e.verifyLink} className="connector" d="M 700 260 L 725 260" style={{ left: 0, top: 190, width: 880, height: 125 }} viewBox="0 190 880 125" />}
      {beat >= 7 && <Box key={e.verify} id={e.verify} Icon={Check} className="verify-node" style={{ left: 730, top: 216, width: 104, height: 86 }}><strong>verify</strong><span>build + render</span><small>PASS</small></Box>}
      {beat >= 8 && <Arrow key={e.modify} id={e.modify} className="modify-arc" d="M 638 109 C 638 174 300 139 300 205" style={{ left: 0, top: 0, width: 880, height: 210 }} />}
      {beat >= 8 && <Label key={e.modifyLabel} id={e.modifyLabel} className="modify-label" style={{ left: 417, top: 139, width: 126, height: 26 }}>ask → edit in place</Label>}
      {beat >= 8 && <SymbolChip key={e.flag} id={e.flag} className="edit-flag" style={{ left: 261, top: 188, width: 78, height: 22 }}>edited</SymbolChip>}
      {beat >= 9 && <Frame key={e.reveal} id={e.reveal} className="reveal-frame" style={{ left: 12, top: 7, width: 856, height: 365 }}><span className="reveal-label">THIS IS ONE OF THOSE PRESENTATIONS</span></Frame>}
    </AnimatePresence>
  </SceneLayer>
}

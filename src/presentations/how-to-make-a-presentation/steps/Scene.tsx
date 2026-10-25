import { AnimatePresence } from 'motion/react'
import { MessageCircle, Sparkles, UserRound, Layers, Check } from 'lucide-react'
import { Box, Label, Arrow, Frame, SymbolChip, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entity } from '../entities'

export function Scene({ payload: beat }: SceneProps<number>) {
  return <SceneLayer>
    <AnimatePresence>
      {beat >= 9 && <Frame key={entity('reveal')} entityId={entity('reveal')} className="reveal" style={{ position: 'absolute', inset: 1 }}><span>This is the presentation.</span></Frame>}
      <Box key={entity('you')} entityId={entity('you')} Icon={UserRound} className="actor you" style={{ left: 40, top: 65, width: 140, height: 70 }}><strong>you</strong></Box>
      <Box key={entity('prompt')} entityId={entity('prompt')} Icon={MessageCircle} className="prompt" style={{ left: 230, top: 86, width: 315, height: 46 }}>“I have a topic…”</Box>
      {beat >= 2 && <Box key={entity('skill')} entityId={entity('skill')} Icon={Sparkles} className="actor skill" style={{ left: 620, top: 65, width: 200, height: 70 }}><strong>the skill</strong></Box>}
      {beat >= 2 && <Arrow key={entity('conversation')} entityId={entity('conversation')} className="conversation" style={{ left: 195, top: 54, width: 410 }}>←<span />→</Arrow>}
      {beat >= 2 && <SymbolChip key={entity('question')} entityId={entity('question')} className="question" style={{ left: 310, top: 15, width: 185 }}>one question at a time</SymbolChip>}
      {beat >= 3 && <Label key={entity('tray')} entityId={entity('tray')} className="tray" style={{ left: 40, top: 172 }}>YOUR STORY <span>/your-presentation</span></Label>}
      {[3, 4, 4].map((start, i) => beat >= start && <Box key={`card-${i}`} entityId={entity(`card-${i}`)} className="step-card" style={{ left: 40 + i * 185, top: 210, width: 150, height: 106 }}>
        <span className="card-number">0{i + 1}</span><strong>{['The idea', 'The mechanism', 'The payoff'][i]}</strong><span>title · caption · visual</span>
        {beat >= 8 && i === 1 && <span className="edited">edited ↻</span>}
      </Box>)}
      {beat >= 4 && [0, 1].map(i => <Arrow key={`morph-${i}`} entityId={entity(`morph-${i}`)} className="morph" style={{ left: 193 + i * 185, top: 247, width: 29 }}>→<span>morph</span></Arrow>)}
      {beat >= 5 && <Box key={entity('ghost')} entityId={entity('ghost')} className="ghost" style={{ left: 595, top: 210, width: 76, height: 106 }}><span>…</span><small>your<br />depth</small></Box>}
      {beat >= 5 && <SymbolChip key={entity('depth')} entityId={entity('depth')} className="depth" style={{ left: 40, top: 144, width: 140 }}>partial ↔ full</SymbolChip>}
      {beat >= 6 && <Box key={entity('kit')} entityId={entity('kit')} Icon={Layers} className="kit" style={{ left: 300, top: 321, width: 260, height: 40 }}>shared scene kit <span>↑</span></Box>}
      {beat >= 7 && <Arrow key={entity('verify-link')} entityId={entity('verify-link')} className="verify-link" style={{ left: 678, top: 249, width: 30 }}>→</Arrow>}
      {beat >= 7 && <Box key={entity('verify')} entityId={entity('verify')} Icon={Check} className="verify" style={{ left: 715, top: 210, width: 125, height: 106 }}><strong>verified</strong><span>build + render</span></Box>}
      {beat >= 8 && <Arrow key={entity('modify')} entityId={entity('modify')} className="modify" style={{ left: 550, top: 140, width: 166, height: 57 }}>modify ↙</Arrow>}
    </AnimatePresence>
  </SceneLayer>
}

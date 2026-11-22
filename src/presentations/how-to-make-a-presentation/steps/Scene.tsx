import { AnimatePresence, motion } from 'motion/react'
import { UserRound, Sparkles, Blocks, CircleCheck } from 'lucide-react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entity } from '../entities'
const position = (left: number, top: number, width?: number, height?: number) => ({ position: 'absolute' as const, left, top, width, height })
export function StoryScene({ payload: beat }: SceneProps<number>) {
  return <SceneLayer>
    <AnimatePresence>
      <Appear key="you"><Box entity={entity('you')} Icon={UserRound} className="person" style={position(70, 58, 120, 54)}>you</Box></Appear>
      <Appear key="prompt"><Label entity={entity('prompt')} className="prompt" style={position(70, 20, 190, 28)}>“I have a topic…”</Label></Appear>
      {beat >= 2 && <Appear key="skill"><Box entity={entity('skill')} Icon={Sparkles} className="person skill" style={position(550, 58, 180, 54)}>the skill</Box></Appear>}
      {beat >= 2 && <Appear key="conversation"><Arrow entity={entity('conversation')} className="conversation" style={position(225, 70, 290, 30)} aria-label="two-way conversation">←────────────→</Arrow><SymbolChip entity={entity('question')} className="question" style={position(290, 30, 180, 28)}>one question at a time</SymbolChip></Appear>}
      {beat >= 3 && <Appear key="tray"><div data-story-tray="" style={position(64, 168, 752, 118)}><Label entity={entity('tray-label')} className="tray-label" style={position(12, 6)}>YOUR STORY / STEP BY STEP</Label></div></Appear>}
      {[1, 2].map((card, i) => beat >= (card === 1 ? 3 : 4) && <Appear key={`card-${card}`}><Box entity={entity(`card-${card}`)} className="step-card" style={position(84 + i * 200, 200, 136, 76)}>
        <span className="card-number">0{card}</span><strong>{card === 1 ? 'The opening' : 'The next beat'}</strong><span>title · caption · visual</span>
        {beat >= 8 && card === 2 && <motion.span layoutId={entity('edited')} className="edited">edited ↺</motion.span>}
      </Box></Appear>)}
      {beat >= 4 && <Appear key="morph-1"><Arrow entity={entity('morph-1')} className="card-link" style={position(222, 220, 60, 42)}>→<small>morphs</small></Arrow></Appear>}
      {beat >= 5 && <Appear key="ghost"><Box entity={entity('ghost')} className="step-card ghost" style={position(484, 200, 136, 76)}><strong>Your next idea</strong><span>leave room to explore</span></Box><Arrow entity={entity('morph-2')} className="card-link" style={position(422, 220, 60, 42)}>→<small>morphs</small></Arrow></Appear>}
      {beat >= 5 && <Appear key="depth"><SymbolChip entity={entity('depth')} className="depth" style={position(70, 115, 170, 24)}>partial ↔ full detail</SymbolChip></Appear>}
      {beat >= 6 && <Appear key="kit"><Box entity={entity('kit')} Icon={Blocks} className="kit-socket" style={position(285, 286, 260, 36)}>shared scene kit · boxes + motion</Box></Appear>}
      {beat >= 7 && <Appear key="verify"><Arrow entity={entity('verify-link')} className="card-link" style={position(622, 222, 60, 30)}>→</Arrow><Box entity={entity('verify')} Icon={CircleCheck} className="verify" style={position(684, 200, 112, 76)}><strong>PASS</strong><span>build + render</span></Box></Appear>}
      {beat >= 8 && <Appear key="modify"><motion.svg layoutId={entity('modify-arc')} data-presentation-entity={entity('modify-arc')} className="modify-arc" width="300" height="80" style={position(350, 116, 300, 80)} aria-label="modify arc from conversation to edited card"><path d="M 270 0 C 270 50 0 20 0 76" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5"/><path d="M -5 68 L 0 76 L 6 68" fill="none" stroke="currentColor" strokeWidth="2"/></motion.svg><Label entity={entity('modify-label')} className="modify-label" style={position(440, 140)}>ask · edit · repeat</Label></Appear>}
      {beat >= 9 && <Appear key="reveal"><Frame entity={entity('reveal')} className="reveal-frame" style={position(30, 0, 810, 364)}><span>AND SCENE — YOU’RE LOOKING AT ONE</span></Frame></Appear>}
    </AnimatePresence>
  </SceneLayer>
}

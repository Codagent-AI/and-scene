import { AnimatePresence, motion } from 'motion/react'
import { UserRound, Sparkles, Check, Layers, MessageCircle } from 'lucide-react'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { Label } from '../../../presentation-kit/nodes/Label'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip'
import { ENTER_DELAY, ENTER_T } from '../../../presentation-kit/constants'
import type { SceneProps } from '../../../presentation-kit/types'
import { entities as e } from '../entities'

export interface Beat { beat: number }

export function Scene({ payload }: SceneProps<Beat>) {
  const beat = payload.beat
  return <SceneLayer aria-label="A conversation becomes an evolving presentation" className="sample-scene">
    <AnimatePresence>
      <Appear key="you">
        <Box layoutId={e.you} Icon={UserRound} className="actor you"><strong>you</strong></Box>
      </Appear>
      <Appear key="prompt">
        <Label layoutId={e.prompt} className="prompt"><MessageCircle size={18} /> “I have a topic.”</Label>
      </Appear>
      {beat >= 2 && <Appear key="conversation">
        <Arrow layoutId={e.conversation} className="conversation-arrow"><span>↔</span></Arrow>
        <Box layoutId={e.skill} Icon={Sparkles} className="actor skill"><strong>skill</strong></Box>
        <SymbolChip layoutId={e.question} className="question">one question at a time</SymbolChip>
      </Appear>}
      {beat >= 3 && <Appear key="tray">
        <Label layoutId={e.tray} className="step-tray"><span>YOUR STORY / ONE CONTINUOUS SCENE</span></Label>
      </Appear>}
      {[0, 1, 2].map(index => beat >= (index === 0 ? 3 : 4) && <Appear key={`card-${index}`}>
        <Box layoutId={e.card(index)} className={`step-card${index === 1 && beat >= 8 ? ' edited' : ''}`} style={{ left: 84 + index * 160 }}>
          <span className="card-number">0{index + 1}</span>
          <strong>{['The idea', 'The story', 'The scene'][index]}</strong>
          <span className="card-parts">title · caption<br />visual</span>
          {index === 1 && beat >= 8 && <span className="edit-flag" data-presentation-allow-overlap="true">edited</span>}
        </Box>
        {index > 0 && <Arrow layoutId={e.link(index)} className="morph-link" style={{ left: 210 + (index - 1) * 160 }}><span>morph</span><b>→</b></Arrow>}
      </Appear>)}
      {beat >= 5 && <Appear key="depth">
        <SymbolChip layoutId={e.depth} className="depth">partial ↔ full</SymbolChip>
        <Box layoutId={e.ghost} className="ghost-card"><span>···</span><strong>your pace</strong></Box>
        <Arrow layoutId={e.link(3)} className="morph-link" style={{ left: 530 }}><span>morph</span><b>→</b></Arrow>
      </Appear>}
      {beat >= 6 && <Appear key="kit">
        <Box layoutId={e.kit} className="kit-socket" Icon={Layers}><span>shared scene kit</span><small>boxes · arrows · motion</small></Box>
      </Appear>}
      {beat >= 7 && <Appear key="verify">
        <Arrow layoutId={e.link(4)} className="verify-link">→</Arrow>
        <Box layoutId={e.verify} className="verify"><Check size={22} /><strong>PASS</strong><span>build + render</span></Box>
      </Appear>}
      {beat >= 8 && <Appear key="modify">
        <Arrow layoutId={e.modify} className="modify-arc">
          <svg viewBox="0 0 300 90" aria-hidden="true"><path d="M -8 8 Q 22 64 106 77" /><path d="m 98 71 8 6 -8 6" /></svg>
          <span>ask → edit in place</span>
        </Arrow>
      </Appear>}
      {beat >= 9 && <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: ENTER_DELAY, duration: ENTER_T }}>
        <Frame layoutId={e.reveal} className="reveal-frame"><span>THIS IS ONE. YOU’VE BEEN INSIDE IT ALL ALONG.</span></Frame>
      </motion.div>}
    </AnimatePresence>
  </SceneLayer>
}

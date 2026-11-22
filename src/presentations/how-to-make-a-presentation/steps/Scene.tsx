import { AnimatePresence } from 'motion/react'
import { Check, Layers, User, Sparkles } from 'lucide-react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Label } from '../../../presentation-kit/nodes/Label'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { SceneProps } from '../../../presentation-kit/types'
import { entity, positions, cardPosition } from '../entities'

export interface Beat { beat: number }
export function Scene({ payload: { beat } }: SceneProps<Beat>) {
  return <SceneLayer>
    <AnimatePresence>
      <Box key="you" id={entity('you')} className="you node" style={positions.you} Icon={User}>you</Box>
      <Label key="prompt" id={entity('prompt')} className="prompt node" style={positions.prompt}>I have a topic…</Label>
      {beat >= 2 && <Box key="skill" id={entity('skill')} className="skill node" style={positions.skill} Icon={Sparkles}>the skill</Box>}
      {beat >= 2 && <Arrow key="conversation" id={entity('conversation')} className="conversation node" style={positions.conversation}>←────────────→</Arrow>}
      {beat >= 2 && <Label key="question" id={entity('question')} className="question node" style={positions.question}>one question at a time</Label>}
      {beat >= 3 && <Box key="tray" id={entity('tray')} className="tray node" style={positions.tray} />}
      {[0, 1, 2].filter(index => beat >= (index === 0 ? 3 : 4)).map(index =>
        <Box key={`card-${index}`} id={entity(`card-${index}`)} className="step-card node" style={cardPosition(index)}>
          <strong>0{index + 1}</strong><span>title</span><span>caption · visual</span>
        </Box>)}
      {[0, 1].map(index => beat >= 4 && <Label key={`morph-${index}`} id={entity(`morph-${index}`)} className="morph node"
        style={{ left: 199 + index * 142, top: 246, width: 25, height: 44 }}>→<small>morph</small></Label>)}
      {beat >= 5 && <Box key="ghost" id={entity('ghost')} className="ghost node" style={cardPosition(3)}>…<span>your next beat</span></Box>}
      {beat >= 5 && <Label key="depth" id={entity('depth')} className="depth node" style={positions.depth}>partial ↔ full</Label>}
      {beat >= 6 && <Box key="kit" id={entity('kit')} className="kit node" style={positions.kit} Icon={Layers}>shared scene kit</Box>}
      {beat >= 7 && <Arrow key="verify-link" id={entity('verify-link')} className="verify-link node" style={{ left: 627, top: 246 }}>→</Arrow>}
      {beat >= 7 && <Box key="verify" id={entity('verify')} className="verify node" style={positions.verify}>
        <strong>verify</strong><span>build + render</span><span className="pass" data-pass="true"><Check size={14} /> pass</span>
      </Box>}
      {beat >= 8 && <Arrow key="modify" id={entity('modify')} className="modify node" style={{ left: 330, top: 118, width: 280, height: 80 }}>
        <svg viewBox="0 0 280 80" aria-hidden="true"><path d="M 250 2 Q 250 50 60 50 Q 36 50 36 78 M 31 70 L 36 78 L 41 70" /></svg>
        <span>modify in place</span>
      </Arrow>}
      {beat >= 8 && <Label key="edited" id={entity('edited')} className="edited node" style={{ left: 230, top: 192 }}>edited</Label>}
      {beat >= 9 && <Frame key="reveal" id={entity('reveal')} className="reveal node" style={positions.reveal}>
        <span>THIS PRESENTATION IS THE EXAMPLE</span>
      </Frame>}
    </AnimatePresence>
  </SceneLayer>
}

import { AnimatePresence } from 'motion/react'
import type { SceneProps } from '../../../presentation-kit/types'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Label } from '../../../presentation-kit/nodes/Label'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { Emphasis } from '../../../presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { entity } from '../entities'

type Payload = { count: number }
export function EvolvingScene({ payload }: SceneProps<Payload>) {
  const count = payload.count
  return <div className="sample-scene">
    <AnimatePresence>
      {count >= 9 && <Appear key="reveal"><Frame layoutId={entity('reveal')} className="reveal-frame"><span>One evolving scene · made by this skill</span></Frame></Appear>}
    </AnimatePresence>
    <Box layoutId={entity('you')} className="person you" style={{ left: 64, top: 34 }}>you</Box>
    <Box layoutId={entity('prompt')} className="prompt" style={{ left: 172, top: 26 }}>“I have a topic…”</Box>
    <AnimatePresence>
      {count >= 2 && <Appear key="skill"><Box layoutId={entity('skill')} className="person skill" style={{ left: 700, top: 34 }}>skill</Box><Arrow layoutId={entity('conversation')} className="conversation-arrow" style={{ left: 284, top: 53, width: 390 }}>↔</Arrow><SymbolChip layoutId={entity('question')} className="question" style={{ left: 420, top: 12 }}>one question at a time</SymbolChip></Appear>}
    </AnimatePresence>
    <div className="card-row" data-presentation-allow-overlap="true">
      <AnimatePresence>
        {count >= 3 && Array.from({ length: Math.max(1, count - 2) }, (_, i) => <Appear key={`card-${i}`} className="card-wrap">
          <Box layoutId={entity(`card-${i}`)} className={`step-card ${count >= 8 && i === 1 ? 'edited' : ''}`} style={{ left: 28 + i * 102, top: 162 }}>
            <b>{['title', 'caption', 'visual', 'morph'][i % 4]}</b><small>step {i + 1}</small>
          </Box>
          {i > 0 && <Label layoutId={entity(`link-${i}`)} className="card-link" style={{ left: 4 + i * 102, top: 212 }}>→</Label>}
        </Appear>)}
      </AnimatePresence>
    </div>
    <AnimatePresence>
      {count >= 5 && <Appear key="depth"><Box layoutId={entity('ghost')} className="ghost-card" style={{ left: 742, top: 162 }}>… next beat</Box><Emphasis layoutId={entity('depth')} className="depth-control" style={{ left: 65, top: 100 }}>partial ↔ full</Emphasis></Appear>}
      {count >= 6 && <Appear key="kit"><SymbolChip layoutId={entity('kit')} className="kit-socket" style={{ left: 375, top: 285 }}>scene kit · boxes · arrows · motion</SymbolChip><Arrow layoutId={entity('kit-plug')} className="plug" style={{ left: 433, top: 263 }}>↓</Arrow></Appear>}
      {count >= 7 && <Appear key="verify"><Box layoutId={entity('verify')} className="verify-node" style={{ left: 691, top: 245 }}>build + render <strong>✓ PASS</strong></Box><Arrow layoutId={entity('verify-link')} className="verify-link" style={{ left: 650, top: 225 }}>→</Arrow></Appear>}
      {count >= 8 && <Appear key="modify"><Label layoutId={entity('modify')} className="modify-arc" style={{ left: 362, top: 111 }}>↘ modify in place</Label><SymbolChip layoutId={entity('flag')} className="edit-flag" style={{ left: 160, top: 143 }}>edited</SymbolChip></Appear>}
    </AnimatePresence>
  </div>
}

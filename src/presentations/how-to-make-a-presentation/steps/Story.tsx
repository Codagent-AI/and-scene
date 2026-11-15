import { AnimatePresence } from 'motion/react'
import { UserRound, Sparkles, Check, Blocks } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import type { Step } from '../../../presentation-kit/types'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Label } from '../../../presentation-kit/nodes/Label'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip'
import { entity, positions, visibleEntities } from '../entities'
import outline from '../outline.json'
export function Story({ payload: beat }: { payload: number }) {
  const pieces: Record<string, ReactNode> = {}
  function add(name: string, node: ReactNode) { pieces[name] = node }
  const at = (name: keyof typeof positions): CSSProperties => ({ position: 'absolute', ...positions[name] })
  add('you', <Box id={entity('you')} style={at('you')} className="person" Icon={UserRound}>you</Box>)
  add('prompt', <SymbolChip id={entity('prompt')} style={at('prompt')} className="prompt">a topic, an idea…</SymbolChip>)
  add('skill', <Box id={entity('skill')} style={at('skill')} className="skill" Icon={Sparkles}>the skill</Box>)
  add('question', <Label id={entity('question')} style={at('question')} className="question">topic → look → each beat</Label>)
  add('conversation', <Arrow id={entity('conversation')} style={at('conversation')} className="conversation">←──────────────────→</Arrow>)
  add('tray', <Label id={entity('tray')} style={at('tray')} className="tray"><span>THE STORY / YOUR STEPS</span></Label>)
  for (let i = 1; i <= 3; i++) {
    add(`card-${i}`, <Box id={entity(`card-${i}`)} className="step-card" style={{ position: 'absolute', left: 65 + (i - 1) * 168, top: 210, width: 130, height: 80 }}><span className="card-number">0{i}</span><strong>{['The idea', 'The exchange', 'The scene'][i - 1]}</strong><small>title · caption · visual</small></Box>)
    if (i < 3) add(`morph-${i}`, <Arrow id={entity(`morph-${i}`)} className="morph" style={{ position: 'absolute', left: 197 + (i - 1) * 168, top: 235, width: 36 }}><span>→</span><small>morph</small></Arrow>)
  }
  add('ghost', <Box id={entity('ghost')} className="ghost" style={{ position: 'absolute', left: 569, top: 210, width: 64, height: 80 }}>…<small>your call</small></Box>)
  add('depth', <SymbolChip id={entity('depth')} style={at('depth')} className="depth">partial ↔ full</SymbolChip>)
  add('kit', <Box id={entity('kit')} style={at('kit')} className="kit" Icon={Blocks}>shared scene kit <small>boxes · arrows · motion</small></Box>)
  add('verify-link', <Arrow id={entity('verify-link')} className="verify-link" style={{ position: 'absolute', left: 635, top: 234 }}>→</Arrow>)
  add('verify', <Box id={entity('verify')} style={at('verify')} className="verify" Icon={Check}><strong>verify</strong><small>build + render ✓</small></Box>)
  add('modify', <Arrow id={entity('modify')} className="modify" style={{ position: 'absolute', left: 745, top: 75, width: 48, height: 120 }}><svg width="48" height="120" viewBox="0 0 48 120" aria-hidden="true"><path d="M0 4 Q42 4 42 42 L42 108 L28 100 M42 108 L48 94" fill="none" stroke="currentColor" strokeWidth="2" /></svg><span>modify</span></Arrow>)
  add('edited', <SymbolChip id={entity('edited')} className="edited" style={{ position: 'absolute', left: 414, top: 295 }}>↑ edited in place</SymbolChip>)
  add('reveal', <Frame id={entity('reveal')} style={at('reveal')} className="reveal"><span>AND SCENE. / THIS IS ONE.</span></Frame>)
  return <SceneLayer><AnimatePresence>{visibleEntities(beat).map(name => <Appear key={name} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{pieces[name]}</Appear>)}</AnimatePresence></SceneLayer>
}
export const STEPS: Step<number>[] = outline.map((meta, i) => ({ ...meta, payload: i + 1, groupKey: 'the-story', Scene: Story }))

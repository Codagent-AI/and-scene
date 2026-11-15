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
import { entity, positions, visibleEntities, cardPosition, morphPosition } from '../entities'
import outline from '../outline.json'
export function Story({ payload: beat }: { payload: number }) {
  const pieces: Record<string, ReactNode> = {}
  function add(name: string, node: ReactNode) { pieces[name] = node }
  const at = (name: keyof typeof positions): CSSProperties => ({ position: 'absolute', ...positions[name] })
  add('you', <Box id={entity('you')} style={at('you')} className="person" Icon={UserRound}>you</Box>)
  add('prompt', <SymbolChip id={entity('prompt')} style={at('prompt')} className="prompt">a topic, an idea…</SymbolChip>)
  add('skill', <Box id={entity('skill')} style={at('skill')} className="skill" Icon={Sparkles}>the skill</Box>)
  add('question', <Label id={entity('question')} style={at('question')} className="question">topic → look → beats</Label>)
  add('conversation', <Arrow id={entity('conversation')} style={at('conversation')} className="conversation"><svg width="100%" height="100%" viewBox="0 0 126 24" aria-hidden="true"><path d="M2 12 H124 M2 12 L10 6 M2 12 L10 18 M124 12 L116 6 M124 12 L116 18" fill="none" stroke="currentColor" strokeWidth="2" /></svg></Arrow>)
  add('tray', <Label id={entity('tray')} style={at('tray')} className="tray"><span>THE STORY / YOUR STEPS</span></Label>)
  for (let i = 1; i <= 3; i++) {
    add(`card-${i}`, <Box id={entity(`card-${i}`)} className="step-card" style={{ position: 'absolute', ...cardPosition(i - 1) }}><span className="card-number">0{i}</span><strong>{['Idea', 'Story', 'Scene'][i - 1]}</strong><small><span>title</span><span>caption</span><span>visual</span></small></Box>)
    if (i < 3) add(`morph-${i}`, <Arrow id={entity(`morph-${i}`)} className="morph" style={{ position: 'absolute', ...morphPosition(i - 1) }}><span>→</span><small>{i === 1 ? 'move' : 'grow'}</small></Arrow>)
  }
  add('ghost', <Box id={entity('ghost')} className="ghost" style={at('ghost')} aria-label="Unspecified steps">…</Box>)
  add('depth', <SymbolChip id={entity('depth')} style={at('depth')} className="depth">partial ↔ full</SymbolChip>)
  add('kit', <Box id={entity('kit')} style={at('kit')} className="kit" Icon={Blocks}>shared scene kit <small>boxes · arrows · motion</small></Box>)
  add('verify-link', <Arrow id={entity('verify-link')} className="verify-link" style={at('verifyLink')}><svg width="100%" height="100%" viewBox="0 0 4 16" aria-hidden="true"><path d="M0 8 H4 M1 5 L4 8 L1 11" fill="none" stroke="currentColor" /></svg></Arrow>)
  add('verify', <Box id={entity('verify')} style={at('verify')} className="verify" Icon={Check}><strong>verify</strong><small aria-label="build + render passed"><span>build</span><span>render</span></small></Box>)
  add('modify', <Arrow id={entity('modify')} className="modify" style={at('modify')}><svg width="68" height="86" viewBox="0 0 68 86" aria-hidden="true"><path d="M0 4 Q62 4 62 30 L62 82 L50 72 M62 82 L66 66" fill="none" stroke="currentColor" strokeWidth="2" /></svg><span>modify</span></Arrow>)
  add('edited', <SymbolChip id={entity('edited')} className="edited" style={at('edited')}>edited ↓</SymbolChip>)
  add('reveal', <Frame id={entity('reveal')} style={at('reveal')} className="reveal"><span>AND SCENE. / THIS IS ONE.</span></Frame>)
  return <SceneLayer><AnimatePresence>{visibleEntities(beat).map(name => <Appear key={name} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{pieces[name]}</Appear>)}</AnimatePresence></SceneLayer>
}
export const STEPS: Step<number>[] = outline.map((meta, i) => ({ ...meta, payload: i + 1, groupKey: 'the-story', Scene: Story }))

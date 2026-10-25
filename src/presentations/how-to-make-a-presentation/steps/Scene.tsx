import { AnimatePresence, motion } from 'motion/react'
import { Box, Label, Arrow, Frame, SymbolChip, Appear, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entities } from '../entities'
import { UserRound, Sparkles, Layers, Check } from 'lucide-react'

export interface DiagramState { beat: number }
export const geometry = {
  you: [30, 65, 100, 68], prompt: [154, 4, 210, 40], skill: [390, 65, 120, 68],
  conversation: [152, 92, 216, 1], question: [189, 52, 142, 28],
  tray: [30, 188, 800, 110], card1: [50, 204, 150, 78], card2: [260, 204, 150, 78],
  ghost: [470, 204, 150, 78], depth: [15, 142, 130, 30], kit: [256, 298, 268, 44],
  verify: [666, 204, 140, 78], modify: [330, 134, 120, 60], reveal: [4, 0, 864, 370],
} as const
export const visibleAt: Record<string, number> = { you: 1, prompt: 1, skill: 2, conversation: 2, question: 2, tray: 3, card1: 3, card2: 4, ghost: 5, depth: 5, kit: 6, verify: 7, modify: 8, reveal: 9 }
export function SampleScene({ payload: { beat } }: SceneProps<DiagramState>) {
  const node = (id: keyof typeof geometry, children: React.ReactNode) => {
    const [left, top, width, height] = geometry[id]
    return beat >= visibleAt[id] && <Appear key={id} style={{ position: 'absolute', left, top, width, height }}>{children}</Appear>
  }
  return <SceneLayer>
    <AnimatePresence>
      {node('you', <Box id={entities.you} className="actor" Icon={UserRound}><strong>you</strong></Box>)}
      {node('prompt', <Box id={entities.prompt} className="prompt">“I have a topic…”</Box>)}
      {node('skill', <Box id={entities.skill} className="actor skill" Icon={Sparkles}><strong>skill</strong></Box>)}
      {node('conversation', <Arrow id={entities.conversation} className="conversation"><span>↔</span></Arrow>)}
      {node('question', <SymbolChip id={entities.question} className="question">one question</SymbolChip>)}
      {node('tray', <Box id={entities.tray} className="tray" aria-label="Accumulating step tray" />)}
      {node('card1', <Box id={entities.card1} className="step-card"><small>01 / THE OPENING</small><strong>title</strong><span>caption · visual</span></Box>)}
      {node('card2', <Box id={entities.card2} className={`step-card ${beat >= 8 ? 'edited' : ''}`}><small>02 / THE NEXT BEAT</small><strong>{beat >= 8 ? 'title, refined' : 'title'}</strong><span>caption · visual</span></Box>)}
      {beat >= 4 && <Appear key="morph" style={{ position: 'absolute', left: 206, top: 226, width: 48 }}><Arrow id={entities.morph} className="morph"><small>morph</small><span>→</span></Arrow></Appear>}
      {node('ghost', <Box id={entities.ghost} className="step-card ghost"><small>… / YOUR CHOICE</small><strong>more beats?</strong><span>leave room to discover</span></Box>)}
      {node('depth', <SymbolChip id={entities.depth} className="depth">partial ↔ full</SymbolChip>)}
      {node('kit', <Box id={entities.kit} className="kit-socket" Icon={Layers}>shared scene kit</Box>)}
      {node('verify', <Box id={entities.verify} className="verify"><strong><Check size={18} /> pass</strong><span>build + render</span></Box>)}
      {beat >= 7 && <Appear key="verify-link" style={{ position: 'absolute', left: 628, top: 231 }}><Arrow id="how-to:verify-link" className="verify-link">→</Arrow></Appear>}
      {node('modify', <Arrow id={entities.modify} className="modify"><svg width="120" height="60" viewBox="0 0 120 60" aria-hidden="true"><motion.path d="M100 0 Q -10 0 0 56" fill="none" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} /><path d="M-3 48 L0 56 L8 50" fill="none" stroke="currentColor" /></svg><span>modify ↙</span></Arrow>)}
      {node('reveal', <Frame id={entities.reveal} className="reveal"><Label id="how-to:reveal-label">THIS IS ONE OF THOSE PRESENTATIONS</Label></Frame>)}
    </AnimatePresence>
  </SceneLayer>
}

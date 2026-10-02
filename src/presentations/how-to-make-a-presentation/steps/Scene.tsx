import { motion } from 'motion/react'
import { Appear, Arrow, Box, EXIT, Emphasis, Frame, Label, Presence, SceneLayer, SymbolChip } from '../../../presentation-kit'
import { entity, stepCard } from '../entities'

export interface ScenePayload { through: number }

const cardParts = ['title', 'caption', 'visual']
const cardsAtStep = [0, 0, 1, 4, 5, 7, 8, 9, 9]
const cardCopy = [
  'Topic', 'Interview', 'Step card', 'More beats', 'Your depth', 'Shared kit', 'Build + render', 'Edit in place', 'One example',
]

export function Scene({ payload }: { payload: ScenePayload }) {
  const n = payload.through
  const cardCount = cardsAtStep[n] ?? 0
  return <SceneLayer className="howto-scene">
    <div className="conversation" data-presentation-entity={entity.conversation}>
      <Box id={entity.you} className="person you" style={{ left: 54, top: 30, width: 136, height: 58 }}>you</Box>
      <Box id={entity.skill} className={`person skill ${n >= 1 ? '' : 'hidden'}`} style={{ left: 690, top: 30, width: 136, height: 58 }}>skill</Box>
      <Box id={entity.prompt} className="prompt" style={{ left: 223, top: 33, width: 245, height: 52 }}>“I have a topic…”</Box>
      <Presence>
        {n >= 1 && <Arrow key="arrow" id="howto-conversation-arrow" className="conversation-arrow" direction="both" style={{ left: 470, top: 50, width: 190, height: 24 }} />}
        {n >= 1 && <SymbolChip key="question" id={entity.question} className="question" style={{ left: 510, top: 12, width: 115, height: 30 }}>one question</SymbolChip>}
      </Presence>
    </div>

    <Presence>
    {cardCount > 0 && <motion.div key="tray" exit={EXIT} className="card-tray" data-presentation-entity={entity.tray} aria-label="Accumulating presentation steps">
      <Presence>
      {Array.from({ length: cardCount }, (_, index) => <Appear key={index} id={`howto-step-entry-${index}`}>
        <Box id={stepCard(index)} className={`step-card ${index === 4 ? 'ghost' : ''} ${index === 7 ? 'edited' : ''}`} style={{ left: 34 + index * 90, top: 150, width: index === 8 ? 66 : 78, height: 100 }}>
        <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
        <strong>{cardCopy[index]}</strong>
        {index === 2 && <span className="card-parts">{cardParts.join(' · ')}</span>}
        {index === 4 && <span className="card-parts">unspecified</span>}
        {index === 7 && <span className="edit-flag">edited</span>}
        </Box>
      </Appear>)}
      </Presence>
      <Presence>
      {cardCount > 1 && Array.from({ length: cardCount - 1 }, (_, index) => <Label key={index} id={`howto-morph-${index}`} className="morph-link" style={{ left: 102 + index * 90, top: 260, width: 42, height: 22 }}>{index === 6 ? '→ check' : 'morph'}</Label>)}
      </Presence>
    </motion.div>}

    {n >= 4 && <motion.div key="depth" exit={EXIT} className="depth-control" data-allow-overlap="" style={{ left: 45, top: 104 }}><span>you choose</span><Emphasis id="howto-depth" className="depth-switch">partial ↔ full</Emphasis></motion.div>}
    {n >= 5 && <Arrow key="kit-plug" id="howto-kit-plug" className="kit-plug" style={{ left: 436, top: 250, width: 2, height: 46 }} />}
    {n >= 5 && <Box key="kit" id={entity.kit} className="kit-socket" style={{ left: 342, top: 296, width: 195, height: 48 }}>shared scene kit</Box>}
    {n >= 6 && <Box key="verify" id={entity.verify} className="verify-node" style={{ left: 824, top: 165, width: 40, height: 70 }}>✓</Box>}
    {n >= 6 && <Label key="verify-detail" id="howto-verify-detail" className="verify-detail" style={{ left: 786, top: 258, width: 78, height: 18 }}>build + render</Label>}
    {n >= 7 && <Arrow key="modify" id={entity.modify} className="modify-arc" direction="back" style={{ left: 172, top: 102, width: 360, height: 38 }}>modify</Arrow>}
    {n >= 8 && <motion.div key="reveal" exit={EXIT} className="reveal-allow-overlap" data-allow-overlap=""><Frame id={entity.frame} className="reveal-frame" style={{ left: 15, top: 3, width: 850, height: 365 }}><span>SELF-REFERENCE · MADE WITH THIS SKILL</span></Frame></motion.div>}
    </Presence>
  </SceneLayer>
}

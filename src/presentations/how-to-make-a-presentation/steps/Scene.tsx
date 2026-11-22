import { AnimatePresence, motion } from 'motion/react'
import { Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit'
import { entity, positions } from '../entities'

export interface Beat { beat: number }

const enter = { opacity: 0, y: 5 }
const settled = { opacity: 1, y: 0 }
const transition = { duration: .25, delay: .5 }

/** A single component instance accumulates the story without replacing its scene. */
export function Scene({ payload: { beat } }: SceneProps<Beat>) {
  const card = (key: 'card1' | 'card2' | 'card3', number: number) => (
    <Box key={key} id={entity(key)} className="step-card" style={positions[key]} data-entity={key}>
      <span className="card-number">0{number}</span>
      <strong>{number === 1 ? 'The opening' : number === 2 ? 'The next beat' : 'The payoff'}</strong>
      <span className="card-parts">title · caption · visual</span>
      {key === 'card2' && beat >= 8 && <span className="edit-flag">edited</span>}
    </Box>
  )
  return <SceneLayer className="sample-scene" data-presentation-scene="sample">
    <Box id={entity('you')} className="actor you" style={positions.you} data-entity="you"><span className="actor-mark">●</span> you</Box>
    <Label id={entity('prompt')} className="prompt-bubble" style={positions.prompt} data-entity="prompt">“I have a topic…”</Label>
    <AnimatePresence>
      {beat >= 2 && <motion.div key="conversation" initial={enter} animate={settled} exit={enter} transition={transition}>
        <Box id={entity('skill')} className="actor skill" style={positions.skill} data-entity="skill"><span className="actor-mark">✳</span> skill</Box>
        <motion.svg layoutId={entity('conversation')} className="conversation-arrow" viewBox="0 0 340 24" style={{ left: 246, top: 73, width: 340, height: 24 }} data-entity="conversation" aria-hidden="true"><path d="M4 12H336M13 4L4 12l9 8M327 4l9 8-9 8" /></motion.svg>
        <SymbolChip id={entity('question')} className="question-chip" style={positions.question} data-entity="question">one question at a time</SymbolChip>
      </motion.div>}
      {beat >= 3 && <motion.div key="tray" initial={enter} animate={settled} exit={enter} transition={transition}>
        <div className="step-tray" style={positions.tray} data-entity="tray"><span>YOUR STORY, TAKING SHAPE</span></div>
        {card('card1', 1)}
      </motion.div>}
      {beat >= 4 && <motion.div key="more-cards" initial={enter} animate={settled} exit={enter} transition={transition}>
        {card('card2', 2)}{card('card3', 3)}
        <Label id={entity('morph1')} className="morph-link" style={{ left: 232, top: 230, width: 35 }} data-entity="morph1">→<small>morph</small></Label>
        <Label id={entity('morph2')} className="morph-link" style={{ left: 406, top: 230, width: 35 }} data-entity="morph2">→<small>morph</small></Label>
      </motion.div>}
      {beat >= 5 && <motion.div key="depth" initial={enter} animate={settled} exit={enter} transition={transition}>
        <Box id={entity('ghost')} className="ghost-card" style={positions.ghost} data-entity="ghost">+<small>your pace</small></Box>
        <SymbolChip id={entity('depth')} className="depth-control" style={positions.depth} data-entity="depth">partial ↔ full</SymbolChip>
      </motion.div>}
      {beat >= 6 && <motion.div key="socket" initial={enter} animate={settled} exit={enter} transition={transition}>
        <Box id={entity('socket')} className="kit-socket" style={positions.socket} data-entity="socket">⌘ shared scene kit</Box>
      </motion.div>}
      {beat >= 7 && <motion.div key="verify" initial={enter} animate={settled} exit={enter} transition={transition}>
        <Label id={entity('verify-link')} className="verify-link" style={{ left: 699, top: 228, width: 20 }} data-entity="verify-link">→</Label>
        <Box id={entity('verify')} className="verify-node" style={positions.verify} data-entity="verify"><strong>verify</strong><span>build + render</span><motion.span className="pass-check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .85, duration: .1 }}>✓ pass</motion.span></Box>
      </motion.div>}
      {beat >= 8 && <motion.div key="modify" initial={enter} animate={settled} exit={enter} transition={transition}>
        <motion.svg layoutId={entity('modify')} className="modify-arc" viewBox="0 0 400 65" style={{ left: 334, top: 122, width: 400, height: 65 }} data-entity="modify" aria-hidden="true"><path d="M350 0C395 55 45 0 4 60m-1-10 1 10 10-3" /></motion.svg>
        <Label id={entity('modify-label')} className="modify-label" style={{ left: 619, top: 149, width: 100 }} data-entity="modify-label">edit in place</Label>
      </motion.div>}
      {beat >= 9 && <motion.div key="reveal" initial={enter} animate={settled} exit={enter} transition={transition}>
        <Frame id={entity('reveal')} className="reveal-frame" style={positions.reveal} data-entity="reveal" />
        <Label id={entity('reveal-label')} className="reveal-label" style={{ left: 65, top: 346, width: 285 }} data-entity="reveal-label">THIS IS THE SKILL’S OWN OUTPUT.</Label>
      </motion.div>}
    </AnimatePresence>
  </SceneLayer>
}

import { AnimatePresence, motion } from 'motion/react'
import { Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit/nodes'
import type { Scene } from '../../presentation-kit/types'
import { ENTITIES as E } from './entities'

type Payload = { beat: number }
const CARD_IDS = [E.cardOne, E.cardTwo, E.cardThree, E.cardFour, E.cardFive]
const CARD_COPY = [
  ['01', 'Topic'],
  ['02', 'Look'],
  ['03', 'Beats'],
  ['04', 'Scene'],
  ['05', 'Render'],
]
const CARD_W = 140
const CARD_STEP = 160

const ReferenceScene: Scene<Payload> = ({ payload: { beat } }) => {
  const cards = Math.min(4, Math.max(beat - 2, 1))
  return <SceneLayer id="reference-scene-layer" data-reference-scene style={{ width: 880, height: 380 }}>
    {beat >= 9 && <Frame id={E.reveal} className="ref-reveal" data-presentation-allow-overlap="true" style={{ position: 'absolute', left: 12, top: 6, width: 856, height: 358 }}><span>THE SKILL, IN THE ACT</span></Frame>}

    <Box id={E.you} className="ref-person ref-you" style={{ position: 'absolute', left: 20, top: 14, width: 240, height: 72 }}><strong>Have a topic</strong></Box>
    <Label id={E.prompt} className="ref-prompt" style={{ position: 'absolute', left: 20, top: 98, width: 340, height: 44 }}>“Make this make sense.”</Label>
    {beat >= 2 && <>
      <Box id={E.skill} className="ref-person ref-skill" style={{ position: 'absolute', left: 620, top: 14, width: 240, height: 72 }}><strong>The skill</strong></Box>
      <motion.svg id={E.conversation} layout layoutId={E.conversation} className="ref-conversation" viewBox="0 0 356 30" style={{ position: 'absolute', left: 262, top: 56, width: 356, height: 30 }} aria-label="Conversation between you and the skill"><path d="M8 15h340m-12-7 12 7-12 7M8 15l12-7m-12 7 12 7" /></motion.svg>
      <SymbolChip id={E.question} className="ref-question" style={{ position: 'absolute', left: 275, top: 12, width: 330, height: 36 }}>TOPIC · LOOK · STORY</SymbolChip>
    </>}

    {beat >= 3 && <>
      <motion.div layout layoutId={E.tray} className="ref-tray" style={{ position: 'absolute', left: 20, top: 158, width: 840, height: 170 }}>
        <span className="ref-tray-label">THE STORY TAKES SHAPE</span>
        <div className="ref-card-row">
          {CARD_IDS.slice(0, cards).map((id, index) => <Box key={id} id={id} className={`ref-step-card ref-card-${index + 1}`} style={{ left: 12 + index * CARD_STEP, top: 50, width: CARD_W, height: 100 }}>
            {beat >= 8 && index === 2 ? <Emphasis id={E.edited} className="ref-edited">EDITED</Emphasis> : <span className="ref-card-index">{CARD_COPY[index][0]}</span>}
            <strong>{CARD_COPY[index][1]}</strong>
            {index < cards - 1 && <span className="ref-morph-link" aria-label="morphs to next step">↗</span>}
          </Box>)}
          <AnimatePresence>{beat === 5 && <motion.div key={E.ghost} exit={{ opacity: 0 }}><Box id={E.ghost} className="ref-step-card ref-ghost" style={{ position: 'absolute', left: 12 + cards * CARD_STEP, top: 50, width: CARD_W, height: 100 }}><span className="ref-card-index">OPEN</span><strong>?</strong></Box></motion.div>}</AnimatePresence>
          {beat >= 7 && <motion.div layout layoutId={E.verify} className="ref-verify" style={{ position: 'absolute', left: 664, top: 50, width: 164, height: 100 }}><span>RENDER</span><b id={E.pass} className="ref-pass">✓ PASS</b></motion.div>}
        </div>
      </motion.div>
      {beat >= 5 && <Label id={E.depth} className="ref-depth" style={{ position: 'absolute', left: 540, top: 98, width: 320, height: 44 }}>PARTIAL <span>↔</span> FULL</Label>}
      {beat >= 6 && <motion.div layout layoutId={E.socket} className="ref-kit" data-presentation-allow-overlap="true" style={{ position: 'absolute', left: 20, top: 334, width: 220, height: 38 }}><span className="ref-socket-dot" /><b>SCENE KIT</b></motion.div>}
    </>}

    {beat >= 5 && <motion.div layout layoutId={E.modify} className="ref-modify" data-presentation-allow-overlap="true" style={{ position: 'absolute', left: 470, top: 162, width: 390, height: 38 }} aria-label="Edit loop"><span>ASK · ADJUST · REPEAT</span></motion.div>}
  </SceneLayer>
}

export { ReferenceScene }

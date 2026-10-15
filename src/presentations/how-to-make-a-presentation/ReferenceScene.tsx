import { motion } from 'motion/react'
import { Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit/nodes'
import type { Scene } from '../../presentation-kit/types'
import { ENTITIES as E } from './entities'

type Payload = { beat: number }
const CARD_IDS = [E.cardOne, E.cardTwo, E.cardThree, E.cardFour, E.cardFive]
const CARD_COPY = [
  ['01 / ASK', 'Topic', 'a starting point'],
  ['02 / SHAPE', 'Look', 'a visual language'],
  ['03 / MAP', 'Beats', 'the story steps'],
  ['04 / BUILD', 'Scene', 'entities in motion'],
  ['05 / CHECK', 'Render', 'a finished example'],
]

const ReferenceScene: Scene<Payload> = ({ payload: { beat } }) => {
  const cards = Math.min(4, Math.max(beat - 2, 1))
  return <SceneLayer id="reference-scene-layer" data-reference-scene style={{ width: 880, height: 380 }}>
    {beat >= 9 && <Frame id={E.reveal} className="ref-reveal" data-presentation-allow-overlap="true" style={{ position: 'absolute', left: 12, top: 8, width: 856, height: 354 }}><span>THE SKILL, IN THE ACT</span></Frame>}

    <Box id={E.you} className="ref-person ref-you" style={{ position: 'absolute', left: 86, top: 40, width: 156, height: 62 }}><span className="ref-kicker">YOU</span><strong>Have a topic</strong></Box>
    <Label id={E.prompt} className="ref-prompt" style={{ position: 'absolute', left: 84, top: 119, width: 190, height: 39 }}>“Make this make sense.”</Label>
    {beat >= 2 && <>
      <Box id={E.skill} className="ref-person ref-skill" style={{ position: 'absolute', left: 636, top: 40, width: 156, height: 62 }}><span className="ref-kicker">THE SKILL</span><strong>One question at a time</strong></Box>
      <motion.svg id={E.conversation} layout layoutId={E.conversation} className="ref-conversation" viewBox="0 0 394 32" style={{ position: 'absolute', left: 243, top: 54, width: 393, height: 32 }} aria-label="Conversation between you and the skill"><path d="M8 16h378m-12-7 12 7-12 7M8 16l12-7m-12 7 12 7" /></motion.svg>
      <SymbolChip id={E.question} className="ref-question" style={{ position: 'absolute', left: 367, top: 27 }}>TOPIC · LOOK · STORY</SymbolChip>
    </>}

    {beat >= 3 && <>
      <motion.div layout layoutId={E.tray} className="ref-tray" style={{ position: 'absolute', left: 42, top: 187, width: 796, height: 139 }}>
        <span className="ref-tray-label">THE STORY TAKES SHAPE</span>
        <div className="ref-card-row">
          {CARD_IDS.slice(0, cards).map((id, index) => <Box key={id} id={id} className={`ref-step-card ref-card-${index + 1}`} style={{ left: 12 + index * 138, top: 30, width: 120, height: 86 }}>
            <span className="ref-card-index">{CARD_COPY[index][0]}</span><strong>{CARD_COPY[index][1]}</strong><small>{CARD_COPY[index][2]}</small>
            {index < cards - 1 && <span className="ref-morph-link" aria-label="morphs to next step">↗</span>}
            {beat >= 8 && index === 2 && <Emphasis id={E.edited} className="ref-edited">EDITED</Emphasis>}
          </Box>)}
          {beat === 5 && <Box id={E.ghost} className="ref-step-card ref-ghost" style={{ left: 12 + cards * 138, top: 30, width: 120, height: 86 }}><span className="ref-card-index">OPEN SLOT</span><strong>?</strong><small>your call</small></Box>}
          {beat >= 7 && <motion.div layout layoutId={E.verify} className="ref-verify" style={{ position: 'absolute', left: 570, top: 46, width: 202, height: 54 }}><span>BUILD + RENDER</span><b id={E.pass} className="ref-pass">✓ PASS</b></motion.div>}
        </div>
      </motion.div>
      {beat >= 5 && <Label id={E.depth} className="ref-depth" style={{ position: 'absolute', left: 286, top: 119 }}>PARTIAL <span>↔</span> FULL</Label>}
      {beat >= 6 && <>
        <motion.div layout layoutId={E.socket} className="ref-kit" data-presentation-allow-overlap="true" style={{ position: 'absolute', left: 322, top: 319, width: 236, height: 45 }}><span className="ref-socket-dot" /><b>SCENE KIT</b><small>shared parts + motion</small></motion.div>
      </>}
    </>}

    {beat >= 5 && <motion.div layout layoutId={E.modify} className="ref-modify" data-presentation-allow-overlap="true" style={{ position: 'absolute', left: 230, top: 112, width: 416, height: 74 }} aria-label="Edit loop"><svg viewBox="0 0 416 74" aria-hidden="true"><path d="M70 0C112 74 306 74 402 8" /><path d="m392 10 10-2-2 10" /></svg><span>ASK · ADJUST · REPEAT</span></motion.div>}
  </SceneLayer>
}

export { ReferenceScene }

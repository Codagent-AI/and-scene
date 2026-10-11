import { motion } from 'motion/react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit'
import { ENTITY_IDS as id } from './entities'

type Payload = { step: number }

const cards = [id.cardOne, id.cardTwo, id.cardThree]
const cardLabels = [
  ['01', 'Title', 'Caption', 'Visual'],
  ['02', 'The story', 'One beat', 'Details'],
  ['03', 'The reveal', 'One scene', 'Motion'],
]

export function ReferenceScene({ payload }: { payload: Payload }) {
  const step = payload.step
  return <div className="reference-scene" data-reference-scene-step={step}>
    <SceneLayer id="conversation" className="conversation-layer">
      {step >= 1 && <>
        <Appear id="you-enters" className="reference-entering"><Box id={id.you} className="entity you-entity" style={{ left: 110, top: 44 }}><Label id="you-label">you</Label></Box></Appear>
        <Appear id="prompt-enters" className="reference-entering"><Box id={id.prompt} className="entity prompt-entity" style={{ left: 245, top: 42 }}><Label id="prompt-label">“I have a topic…”</Label></Box></Appear>
      </>}
      {step >= 2 && <Appear id="interview-enters" className="reference-entering">
        <Arrow id={id.dialogue} className="dialogue-arrow" style={{ left: 150, top: 104, width: 250 }} />
        <Box id={id.skill} className="entity skill-entity" style={{ left: 480, top: 44 }}><Label id="skill-label">the skill</Label></Box>
        <SymbolChip id={id.question} className="question-chip" style={{ left: 273, top: 91 }}>one question at a time</SymbolChip>
      </Appear>}
      {step >= 5 && <Appear id="depth-enters" className="reference-entering"><SymbolChip id={id.depth} className="depth-chip" style={{ left: 116, top: 108 }}>partial ↔ full</SymbolChip></Appear>}
      {step >= 8 && <Appear id="modify-enters" className="reference-entering">
        <Arrow id={id.modify} className="modify-arc" style={{ left: 600, top: 65, width: 240, height: 95 }}>↘ modify in place</Arrow>
      </Appear>}
    </SceneLayer>

    <SceneLayer id="tray" className="tray-layer">
      {step >= 3 && <Appear id="tray-enters" className="reference-entering"><Label id={id.tray} className="tray-label">THE STORY TAKES SHAPE</Label></Appear>}
      {cards.map((card, index) => step >= index + 3 && <Appear key={card} id={`${card}-enters`} className="reference-entering">
        <Box id={card} className={`entity step-card card-${index + 1}${index === 2 && step >= 8 ? ' edited-card' : ''}`} data-presentation-allow-overlap={index === 2 && step >= 8 ? '' : undefined} style={{ left: 64 + index * 170, top: 164 }}>
          <span className="card-number">{cardLabels[index][0]}</span>
          <strong>{cardLabels[index][1]}</strong>
          <span>{cardLabels[index][2]}</span>
          <span className="card-visual">{cardLabels[index][3]}</span>
        </Box>
      </Appear>)}
      {step >= 4 && <Appear id="morph-notes-enter" className="reference-entering"><>
        <span className="card-morph morph-one">TITLE · CAPTION MORPH</span>
        <span className="card-morph morph-two">VISUAL · MOTION MORPH</span>
      </></Appear>}
      {step >= 5 && <Appear id="ghost-enters" className="reference-entering"><Box id={id.ghost} className="entity ghost-card" style={{ left: 552, top: 164 }}>… next steps</Box></Appear>}
      {step >= 6 && <Appear id="kit-enters" className="reference-entering">
        <Arrow id="kit-connector" className="kit-connector" style={{ left: 470, top: 268, width: 2, height: 28 }} />
        <Box id={id.kit} className="entity kit-socket" style={{ left: 366, top: 301 }}><span className="socket-dot" /> shared scene kit</Box>
      </Appear>}
      {step >= 7 && <Appear id="verify-enters" className="reference-entering">
        <Arrow id="verify-connector" className="verify-connector" style={{ left: 670, top: 197, width: 63 }} />
        <Box id={id.verify} className="entity verify-node" style={{ left: 740, top: 170 }}><span>build + render</span><span className="pass-mark">✓</span></Box>
      </Appear>}
    </SceneLayer>

    {step >= 9 && <SceneLayer id="reveal" className="reveal-layer">
      <Appear id="reveal-enters" className="reference-entering">
        <Frame id={id.reveal} className="reveal-frame" style={{ left: 46, top: 22, width: 788, height: 336 }} />
        <motion.div className="reveal-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>YOU’RE LOOKING AT ONE</motion.div>
      </Appear>
    </SceneLayer>}
  </div>
}

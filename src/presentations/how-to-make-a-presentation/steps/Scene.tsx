import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import { ENTITY_IDS, stepCardId } from '../entities'
import '../presentation.css'

export type Payload = { stage: number }

const cards = [
  ['01', 'title', 'caption', 'visual'],
  ['02', 'title', 'caption', 'visual'],
  ['03', 'title', 'caption', 'visual'],
  ['04', 'title', 'caption', 'visual'],
] as const

export function Scene({ payload }: { payload: Payload }) {
  const { stage } = payload
  return (
    <SceneLayer className="sample-scene">
      <div className="conversation">
        <Box id={ENTITY_IDS.you} className="entity you-box"><span className="entity-kicker">audience</span><strong>you</strong></Box>
        {stage >= 0 && <Box id={ENTITY_IDS.prompt} className="entity prompt-box"><span className="entity-kicker">the ask</span><strong>make a presentation</strong></Box>}
        {stage >= 0 && <Arrow id="sample-ask-arrow" className="arrow ask-arrow">↔</Arrow>}
        {stage >= 1 && <Box id={ENTITY_IDS.skill} className="entity skill-box"><span className="entity-kicker">the skill</span><strong>one question at a time</strong></Box>}
        {stage >= 1 && <Arrow id="sample-question-arrow" className="arrow question-arrow">↔</Arrow>}
        {stage >= 1 && <SymbolChip id={ENTITY_IDS.question} className="chip question-chip">question</SymbolChip>}
      </div>

      {stage >= 2 && <div className="tray-label">answers become a scene</div>}
      {stage >= 2 && <div className="tray" data-allow-overlap>
        {cards.slice(0, Math.min(cards.length, Math.max(1, stage - 1))).map(([number, ...parts], index) => (
          <Box id={stepCardId(index)} key={stepCardId(index)} className={`entity step-card ${index === 0 && stage === 7 ? 'flagged' : ''}`}>
            <span className="card-number">{number}</span>
            {parts.map((part) => <span key={part} className="card-part">{part}</span>)}
          </Box>
        ))}
        {stage >= 4 && <Box id="sample-ghost-card" className="entity step-card ghost-card"><span className="card-number">?</span><span className="card-part">sketch</span></Box>}
      </div>}

      {stage >= 4 && <div className="depth-control"><Emphasis id="sample-depth-label">partial</Emphasis><Arrow id="sample-depth-arrow" className="arrow">↔</Arrow><Emphasis id="sample-full-label">full</Emphasis></div>}
      {stage >= 5 && <Box id={ENTITY_IDS.sceneKit} className="entity kit-box"><span className="entity-kicker">shared kit</span><strong>scene kit</strong></Box>}
      {stage >= 6 && <Box id={ENTITY_IDS.verify} className="entity verify-box"><span className="entity-kicker">pipeline</span><strong>build + render</strong><span className="pass">✓ pass</span></Box>}
      {stage >= 7 && <div className="modify-arc"><Arrow id={ENTITY_IDS.modify} className="arrow">↘</Arrow><Label id="sample-modify-label">edit in place</Label></div>}
      {stage >= 8 && <Frame id={ENTITY_IDS.reveal} className="reveal-frame"><Label id="sample-reveal-label">this is one presentation</Label></Frame>}
    </SceneLayer>
  )
}

import { Arrow, Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { ENTITY } from './entities'

export interface SamplePayload { through: number }

const cardCopy = [
  ['01', 'The topic', 'Title · caption · visual'],
  ['02', 'Gather answers', 'One question at a time'],
  ['03', 'Shape the story', 'Changes link each beat'],
] as const

export function Scene({ payload }: SceneProps<SamplePayload>) {
  const step = payload.through
  return <SceneLayer className="sample-scene">
    <div className="conversation">
      <Box id={ENTITY.you} className="entity person" style={{ left: 56, top: 24 }}><span className="eyebrow">THE VIEWER</span><strong>You</strong>{step >= 5 && <SymbolChip className="depth-toggle">partial <b>↔</b> full</SymbolChip>}</Box>
      <Box id={ENTITY.prompt} className="entity prompt" style={{ left: 224, top: 34 }}><span className="eyebrow">YOUR OPENING</span><strong>A topic, please.</strong></Box>
      {step >= 2 && <>
        <Box id={ENTITY.skill} className="entity skill" style={{ left: 638, top: 24 }}><span className="eyebrow">THE GUIDE</span><strong>The skill</strong></Box>
        <Arrow className="conversation-arrow" from={ENTITY.you} to={ENTITY.skill} label="Two-way conversation" />
        <SymbolChip id={ENTITY.question} className="question-chip">one question at a time</SymbolChip>
      </>}
    </div>

    {step >= 3 && <div className="route-row" aria-label="Presentation pipeline">
      {cardCopy.slice(0, Math.min(Math.max(step - 2, 1), cardCopy.length)).map(([number, title, detail], index) => <div className="route-piece" key={number}>
        {index > 0 && <div className="route-link"><span>→</span>{index === 1 ? 'next beat' : 'morph'}</div>}
        <Box id={`how-to-make-a-presentation:card-${number}`} className={`step-card ${index === step - 1 ? 'step-card--new' : ''}`}>
          <span className="card-number">{number}</span><strong>{title}</strong><small>{detail}</small>
        </Box>
      </div>)}
      {step >= 7 && <div className="route-piece verify-piece"><div className="route-link"><span>→</span>check</div><Box id={ENTITY.verify} className="verify-node"><span className="eyebrow">BUILD + RENDER</span><strong>✓ Pass</strong></Box></div>}
    </div>}

    {step >= 5 && <SymbolChip className="ghost-card">05 · your next beat</SymbolChip>}
    {step >= 6 && <>
      <div className="kit-connector" aria-hidden="true" />
      <Box id={ENTITY.sceneKit} className="kit-socket"><span>SHARED SCENE KIT</span><b>Boxes · arrows · motion</b></Box>
    </>}
    {step >= 8 && <>
      <svg className="modify-arc" viewBox="0 0 880 380" aria-hidden="true"><path d="M 97 99 C 110 160, 120 270, 250 270 S 480 266, 574 260" /></svg>
      <SymbolChip id={ENTITY.modify} className="modify-chip">edit in place ↻</SymbolChip>
      <div className="edited-mark">EDITED</div>
    </>}
    {step >= 9 && <Frame className="reveal-frame" label="Self-reference reveal"><span>BUILT WITH THE SAME SKILL</span></Frame>}
    <div className="scene-footnote"><Label>ONE SCENE · NINE BEATS</Label><span>{String(step).padStart(2, '0')} / 09</span></div>
  </SceneLayer>
}

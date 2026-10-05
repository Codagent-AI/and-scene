import { Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit'
import { Check, CircleHelp, CornerDownLeft, Sparkles } from 'lucide-react'
import { entity } from './entities'

export function Scene({ index }: { index: number }) {
  return <SceneLayer className="sample-scene">
    <div key="conversation" className="conversation" data-presentation-allow-overlap="">
      <Box id={entity.you} className="actor actor--you" label="you" />
      {index >= 0 && <Box id={entity.prompt} className="prompt" label="I have a topic…" />}
      {index >= 1 && <>
        <Arrow id={`${entity.skill}/conversation`} className="conversation-arrow" label="two-way conversation" />
        <Box id={entity.skill} className="actor actor--skill" Icon={Sparkles} label="skill" />
        <SymbolChip id={entity.question} className="question-chip"><CircleHelp size={14} /> one question at a time</SymbolChip>
      </>}
    </div>

    {index >= 2 && <div key="step-tray" className="step-tray" data-presentation-tray="">
      {Array.from({ length: Math.min(index - 1, 5) }, (_, cardIndex) => (
          <Box key={entity.card(cardIndex + 1)} id={entity.card(cardIndex + 1)} className={`step-card ${index >= 7 && cardIndex === 1 ? 'step-card--selected' : ''}`}>
          <span className="step-card__number">0{cardIndex + 1}</span>
          <span className="step-card__title">{['Ask', 'Gather', 'Shape', 'Build', 'Polish'][cardIndex]}</span>
          <span className="step-card__parts">title · visual</span>
        </Box>
      ))}
      {index >= 4 && <Box id={`${entity.tray}/ghost`} className="step-card step-card--ghost" label="…" />}
      {index >= 5 && <Box id={entity.kit} className="kit-socket" label="scene kit · shared shapes + motion" />}
      {index >= 6 && <>
        <Arrow id={`${entity.verify}/chain`} className="verify-link" label="verification pipeline" />
        <Box id={entity.verify} className="verify-node"><Check size={15} /><span>build + render</span><b>PASS</b></Box>
      </>}
    </div>}

    {index >= 4 && <div key="depth-control" className="depth-control" data-presentation-allow-overlap="">
      <span>you choose</span><span className="depth-pill">partial <i /> full</span>
    </div>}
    {index >= 7 && <div key="modify-route" className="modify-route"><CornerDownLeft size={15} /><span>ask for a change</span></div>}
      {index >= 8 && <div key="reveal-frame" className="reveal-allow-overlap" data-presentation-allow-overlap=""><Frame id={entity.reveal} className="reveal-frame" style={{ inset: '-68px 48px -154px -20px' }}><Label id={`${entity.reveal}/label`} className="reveal-label">A presentation made with this skill</Label></Frame></div>}
  </SceneLayer>
}

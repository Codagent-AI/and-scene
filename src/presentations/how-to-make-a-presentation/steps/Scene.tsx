import { Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'

const cardTitles = ['Ask', 'Gather', 'Shape', 'Choose', 'Assemble', 'Check', 'Revise', 'Reveal']

export default function Scene({ payload: beat }: SceneProps<number>) {
  const showSkill = beat >= 1
  const showCards = beat >= 2
  const cardCount = beat < 3 ? 1 : beat < 5 ? 4 : 8
  return <SceneLayer className="story-scene">
    <div className="conversation" data-scene-group="conversation">
      <Box id="sample:you" className="person you"><Label id="sample:you-label">you</Label></Box>
      <div className="prompt"><SymbolChip id="sample:prompt" className="prompt-chip">a topic</SymbolChip></div>
      {showSkill && <>
        <Arrow id="sample:conversation-arrow" className="conversation-arrow">↔</Arrow>
        <Box id="sample:skill" className="person skill"><Label id="sample:skill-label">skill</Label></Box>
        <SymbolChip id="sample:question" className="question-chip">one question at a time</SymbolChip>
      </>}
    </div>
    {showCards && <div className="route" data-scene-group="route">
      <div className="card-tray" aria-label="Accumulating step cards">
        {cardTitles.slice(0, cardCount).map((title, index) => <Box key={title} id={`sample:card-${index + 1}`} className={`step-card${index === 0 ? ' first-card' : ''}${beat === 7 && index === 3 ? ' edited-card' : ''}`} data-card-index={index + 1}>
          <span className="card-number">{String(index + 1).padStart(2, '0')}</span><Label id={`sample:card-${index + 1}-title`}>{title}</Label>
          {index === 0 && <span className="card-parts">title · caption · visual</span>}
        </Box>)}
        {beat >= 4 && <Box id="sample:ghost" className="step-card ghost-card" data-allow-overlap=""><span>…</span><small>your next beat</small></Box>}
        {beat >= 6 && <>
          <Arrow id="sample:verify-link" className="verify-link">→</Arrow>
          <Box id="sample:verify" className="verify-node"><Label id="sample:verify-label">verify</Label><span>build + render</span><b aria-label="passed">✓</b></Box>
        </>}
      </div>
      {beat >= 5 && <div className="kit-socket"><span className="socket-stem"/><Box id="sample:kit" className="kit-node"><Label id="sample:kit-label">shared scene kit</Label><small>boxes · arrows · motion</small></Box></div>}
    </div>}
    {beat >= 4 && <div className="depth-control" data-allow-overlap=""><Arrow id="sample:depth-arrow" className="depth-arrow">⌁</Arrow><span>partial</span><i/><span>full</span></div>}
    {beat >= 7 && <div className="modify-arc" aria-label="Modify loop">↶ <span>edit in place</span></div>}
    {beat >= 8 && <Frame id="sample:reveal-frame" className="reveal-frame"><span>This is one</span></Frame>}
  </SceneLayer>
}

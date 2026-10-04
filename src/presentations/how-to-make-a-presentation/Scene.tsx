import type { SceneProps } from '../../presentation-kit'
import { Arrow, Box, Emphasis, Frame, Label, SymbolChip } from '../../presentation-kit'
import { ENTITY } from './entities'

export function EvolvingScene({ index }: SceneProps<null>) {
  return <div className="sample-scene">
    <div className="conversation">
      <Box entityId={ENTITY.you} className="person you"><span className="eyebrow">THE AUTHOR</span><strong>you</strong><small>one good question</small></Box>
      {index >= 1 && <>
        <Arrow entityId="how-to-make-a-presentation:conversation-arrow" className="conversation-arrow">↔</Arrow>
        <Box entityId={ENTITY.skill} className="person skill"><span className="eyebrow">YOUR GUIDE</span><strong>skill</strong><small>listening closely</small></Box>
      </>}
      {index === 0 && <Box entityId={ENTITY.prompt} className="prompt">“I have a topic…”</Box>}
      {index >= 1 && <SymbolChip entityId={ENTITY.question} label="one question at a time" className="question-chip" />}
      {index >= 4 && <Box entityId={ENTITY.depth} className="depth-control"><span>DEPTH</span><strong>partial ↔ full</strong></Box>}
    </div>
    {index >= 2 && <div className="route-row">
      <div className="tray" aria-label="Accumulating step cards">
        <span className="eyebrow tray-label">YOUR STORY · STEP CARDS</span>
        <div className="cards">
          <Box entityId={ENTITY.card1} className="step-card"><span>01 · ASK</span><strong>Title</strong><small>Caption · visual</small></Box>
          {index >= 3 && <Arrow entityId="how-to-make-a-presentation:morph-link" className="morph-link">morphs →</Arrow>}
          {index >= 3 && <Box entityId={ENTITY.card2} className="step-card"><span>02 · SHAPE</span><strong>New beat</strong><small>Same scene</small></Box>}
          {index >= 3 && <Box entityId={ENTITY.card3} className="step-card"><span>03 · CONNECT</span><strong>What changes?</strong><small>Morph forward</small></Box>}
          {index >= 4 && <Box entityId={ENTITY.ghost} className="step-card ghost"><span>···</span><strong>Your pace</strong><small>More when ready</small></Box>}
          {index >= 6 && <>
            <Arrow entityId="how-to-make-a-presentation:verify-link" className="card-link">→</Arrow>
            <Box entityId={ENTITY.verify} className="verify-card"><span>BUILD + RENDER</span><strong>✓ All clear</strong></Box>
          </>}
        </div>
        {index >= 3 && <div className="morph-note">what morphs →</div>}
      </div>
    </div>}
    {index >= 5 && <>
      <Arrow entityId="how-to-make-a-presentation:kit-connector" className="kit-connector">↓</Arrow>
      <Box entityId={ENTITY.kit} className="kit-socket"><span>DRAWN WITH</span><strong>shared scene kit</strong><small>boxes · arrows · motion</small></Box>
    </>}
    {index >= 7 && <>
      <Arrow entityId={ENTITY.modify} className="modify-arc">↘</Arrow>
      <Emphasis entityId={ENTITY.edited} className="edited-flag">EDITED IN PLACE</Emphasis>
    </>}
    {index >= 8 && <Frame entityId={ENTITY.reveal} className="reveal-frame"><Label entityId="how-to-make-a-presentation:reveal-label" className="reveal-label">A PRESENTATION MADE WITH THIS SKILL</Label></Frame>}
  </div>
}
